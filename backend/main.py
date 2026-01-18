from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import services
import utils
import json
import pygments
from pygments import highlight
from pygments.lexers import JsonLexer
from pygments.formatters import TerminalFormatter
from models.schemas import LineItem, AuditResult, AppealRequest, QueryRequest
import os

app = FastAPI(title="ClaimShield Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cpt_database = {}
cpt_medicare_rates = {}

@app.on_event("startup")
def startup_event():
    global cpt_database
    global cpt_medicare_rates
    cpt_database = services.load("database/cpt_codes.json")
    cpt_medicare_rates = services.load("database/cpt_medicare_rates.json")
    print(f"Loaded {len(cpt_database)} CPT codes.")
    print(f"Loaded {len(cpt_medicare_rates)} CPT Medicare rates.")



@app.post("/api/audit")
async def audit_endpoint(
    clinical_notes: UploadFile = File(...),
    hospital_bill: UploadFile = File(...)
):
    print("Processing clinical notes...")
    try:
        clinical_notes_pages = utils.extract_text_from_file(clinical_notes)
        clinical_notes_text = "\n".join(clinical_notes_pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process clinical notes: {str(e)}")

    print("Processing hospital bill...")
    try:
        invoice_pages = utils.extract_text_from_file(hospital_bill)
        invoice_text = "\n".join(invoice_pages)
        invoice_data = services.parse_invoice(invoice_text.encode("utf-8"), "text/plain")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse hospital bill: {str(e)}")

    print("Enriching CPT codes...")
    cpt_codes_list = invoice_data.get("cpt_codes", [])
    official_definitions_parts = []
    
    for code in cpt_codes_list:
        code_str = str(code).strip()
        defn = cpt_database.get(code_str, "Definition not found in local database.")
        official_definitions_parts.append(f"Code {code_str} Official Definition: {defn}")
    
    official_definitions = "\n".join(official_definitions_parts)

    print("Running audit...")
    try:
        audit_report = services.audit_claim(
            clinical_notes_text=clinical_notes_text,
            invoice_json=invoice_data,
            official_definitions=official_definitions,
            medicare_rates=cpt_medicare_rates
        )

        print("\n" + "="*50)
        print("🔍 AUDIT REPORT GENERATED")
        print("="*50)
        
        formatted_json = json.dumps(audit_report, indent=2)
        try:
            colorful_json = highlight(formatted_json, JsonLexer(), TerminalFormatter())
            print(colorful_json)
        except Exception:
            print(formatted_json)
            
        print("="*50 + "\n")
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")

    # Inject extracted text into the report for frontend display
    audit_report["clinical_notes_text"] = clinical_notes_text
    audit_report["clinical_notes_pages"] = clinical_notes_pages
    audit_report["hospital_bill_text"] = invoice_text
    audit_report["hospital_bill_pages"] = invoice_pages

    return audit_report



@app.post("/api/generate-appeal")
async def generate_appeal_endpoint(request: AppealRequest):
    print(f"Generating appeal letter with level {request.level}...")
    try:
        letter = services.generate_appeal_letter(request.audit_result, request.level)
        return {"appeal_letter": letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate appeal letter: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
