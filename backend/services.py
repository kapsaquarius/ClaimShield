import json
import os
import base64
import requests
from typing import List, Dict, Any, Union
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("MODEL")

def load(path: str) -> Dict[str, str]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return {}

def _load_prompt(filename: str) -> str:
    try:
        with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error loading prompt {filename}: {e}")
        return ""

def _encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

def call_openrouter_api(messages: List[Dict[str, Any]], model: str = MODEL) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY environment variable not set.")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Invalid API response: {data}")
    except Exception as e:
        raise Exception(f"OpenRouter API call failed: {str(e)}")

def parse_invoice(file_content: bytes, mime_type: str) -> Dict[str, Any]:
    invoice_prompt = _load_prompt("invoice_extraction.txt")
    user_content = []
    
    if mime_type.startswith("image/"):
        base64_image = _encode_image(file_content)
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{base64_image}"
            }
        })
        user_content.append({"type": "text", "text": "Extract data from this medical bill image."})
    else:
        try:
            text_content = file_content.decode('utf-8')
            user_content.append({"type": "text", "text": f"Extract data from this medical bill:\n\n{text_content}"})
        except UnicodeDecodeError:
             raise ValueError("PDF/Binary invoice must be converted to text or images before sending to this specific model endpoint.")

    messages = [
        {"role": "system", "content": invoice_prompt},
        {"role": "user", "content": user_content}
    ]
    
    response_text = call_openrouter_api(messages)
    response_text = response_text.replace("```json", "").replace("```", "").strip()
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        raise Exception(f"Failed to parse JSON from Invoice Agent response: {response_text}")

def audit_claim(clinical_notes_text: str, invoice_json: Dict[str, Any], official_definitions: str, medicare_rates: Dict[str, float] = {}) -> Dict[str, Any]:
    audit_prompt = _load_prompt("audit_claim.txt")
    formatted_prompt = audit_prompt.replace("{clinical_notes_text}", clinical_notes_text)
    formatted_prompt = formatted_prompt.replace("{invoice_json}", json.dumps(invoice_json))
    formatted_prompt = formatted_prompt.replace("{official_definitions}", official_definitions)

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant. Output JSON only."}, 
        {"role": "system", "content": formatted_prompt}, 
        {"role": "user", "content": "Perform the audit."}
    ]
    
    response_text = call_openrouter_api(messages)
    response_text = response_text.replace("```json", "").replace("```", "").strip()

    audit_result = {}
    try:
        audit_result = json.loads(response_text)
    except json.JSONDecodeError:
        raise Exception(f"Failed to parse JSON from Auditor Agent: {response_text}")

    audit_result["price_gouging_details"] = _calculate_price_gouging(invoice_json, medicare_rates)
    return audit_result

def _calculate_price_gouging(invoice_json: Dict[str, Any], medicare_rates: Dict[str, float]) -> List[Dict[str, Any]]:
    gouging_details = []
    print("invoice_json", invoice_json)
    line_items = invoice_json.get("line_items", [])
    for item in line_items:
        cpt = item.get("cpt_code")
        amount = item.get("amount")
        if cpt and amount:
            cpt_str = str(cpt).strip()
            medicare_rate = medicare_rates.get(cpt_str)
            if medicare_rate:
                try:
                    val_amount = amount
                    if isinstance(val_amount, str):
                        val_amount = float(str(val_amount).replace("$","").replace(",",""))
                    if medicare_rate > 0:
                        markup = val_amount / medicare_rate
                        gouging_details.append({
                            "cpt_code": cpt_str,
                            "charged_amount": val_amount,
                            "medicare_rate": medicare_rate,
                            "gouging_multiple": round(markup, 2)
                        })
                except (ValueError, TypeError):
                    pass
    return gouging_details

def generate_appeal_letter(audit_result: Dict[str, Any], level: int) -> str:
    tone_instructions = {
        1: "Write a curious, collaborative email asking for clarification. Use phrases like 'I was confused by this item' and 'Could you help me understand?' Do not accuse them of error yet. Persona: Confused Patient.",
        2: "Write a polite but specific message pointing out a discrepancy. Assume it is a typo. Use phrases like 'I noticed the bill lists X, but my doctor mentioned Y' and 'Please double-check the records.' Persona: Sharp Observer.",
        3: "Write a formal, direct business letter. State the facts clearly: 'The clinical evidence does not support Code X.' Request a specific correction and re-issuance of the bill. Do not use 'I feel' statements; stick to the data. Persona: Professional Auditor.",
        4: "Write a stern, authoritative objection. Explicitly state that the charge is invalid according to standard billing guidelines. Use phrases like 'This claim is rejected based on lack of medical necessity' and 'Immediate removal of this charge is required.' Persona: Policy Enforcer.",
        5: "Write a firm, legal notice citing the No Surprises Act and Federal False Claims Act. Demand a written response within 30 days and mention reporting this to the State Insurance Commissioner if not resolved. Persona: Legal Enforcer."
    }
    
    selected_instruction = tone_instructions.get(level, tone_instructions[3])
    
    appeal_prompt = _load_prompt("appeal_letter.txt")
    formatted_prompt = appeal_prompt.replace("{audit_json}", json.dumps(audit_result))
    formatted_prompt = formatted_prompt.replace("{tone_instruction}", selected_instruction)
    
    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": formatted_prompt}
    ]
    
    return call_openrouter_api(messages)
