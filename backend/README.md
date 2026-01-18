# ClaimShield Backend API

The ClaimShield backend is a high-performance **FastAPI** application designed to handle the complex orchestration of OCR, data parsing, and LLM-based auditing. It serves as the brain of the platform, transforming raw unstructured medical documents into structured, actionable insights.

## Tech Stack

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
*   **Server:** Uvicorn
*   **AI/LLM:** OpenRouter API (Accessing models like GPT-4o, Claude 3.5 Sonnet)
*   **OCR & File Processing:**
    *   `PyMuPDF` (fitz): For high-fidelity PDF text extraction.
    *   `Pytesseract`: For OCR on image-based uploads.
    *   `Pillow` (PIL): For image manipulation.
*   **Data Management:** Local JSON databases for CPT Codes and Medicare Rates.

## LLM Architecture & OpenRouter Integration

We utilize an **Agentic Workflow** utilizing the **OpenRouter API** to chain together specialized AI agents. This allows us to use the best model for each specific sub-task (e.g., a vision-capable model for invoices, a high-reasoning model for auditing).

### The Agent Pipeline

1.  **Invoice Extraction Agent:**
    *   **Goal:** Convert "ragged" OCR text or raw images of hospital bills into a standardized JSON schema.
    *   **Prompt:** `prompts/invoice_extraction.txt`
    *   **Model Input:** Raw text chunk or Base64 encoded image.
    *   **Output:** JSON object containing line items, CPT codes, and cost breakdowns.

2.  **Auditor Agent:**
    *   **Goal:** Cross-reference clinical validity against billed items.
    *   **Data Injection:** We construct a massive context window containing:
        *   Patient's Clinical Notes (SOAP).
        *   Parsed Invoice JSON (from Agent 1).
        *   *Golden Data:* Official CPT definitions retrieved from our local database to prevent hallucinations.
    *   **Prompt:** `prompts/audit_claim.txt`
    *   **Output:** A detailed audit report with flagged discrepancies, potential upcoding, and medical necessity reasoning.

3.  **Appeal Generator Agent:**
    *   **Goal:** specific legal/advocacy content.
    *   **Mechanism:** Takes the audit result and a "Tone" parameter (1-5).
    *   **Prompt:** `prompts/appeal_letter.txt`
    *   **Output:** A fully formatted letter ready for PDF generation.

## API Routes

### 1. Audit Claim
**Endpoint:** `POST /api/audit`

Analyzes uploaded documents to perform a full medical bill audit.

*   **Request Body (`multipart/form-data`):**
    *   `clinical_notes`: File (PDF/Image) - The doctor's SOAP notes.
    *   `hospital_bill`: File (PDF/Image) - The final invoice to audit.

*   **Process flow:**
    1.  **Ingest:** Files are received and processed based on MIME type. PDFs use `PyMuPDF` for speed; Images use `Pytesseract`.
    2.  **Parse:** The *Invoice Agent* extracts structured data from the bill.
    3.  **Enrich:** The system queries the local `cpt_database` to look up official definitions for every code found.
    4.  **Audit:** The *Auditor Agent* performs the cross-reference logic.
    5.  **Gouging Check:** A deterministic algorithm compares billed amounts against the local `cpt_medicare_rates` database.

*   **Response (JSON):**
    ```json
    {
      "patient_details": { ... },
      "flagged_items": [
        {
          "cpt_code": "99285",
          "error_type": "Upcoding",
          "reason": "Clinical notes do not support Level 5 emergency visit...",
          "confidence": "High"
        }
      ],
      "price_gouging_details": [ ... ],
      "audit_summary": "..."
    }
    ```

### 2. Generate Appeal Letter
**Endpoint:** `POST /api/generate-appeal`

Generates a formal appeal letter based on a previous audit.

*   **Request Body (JSON):**
    ```json
    {
      "audit_result": { ... }, // The full JSON object returned from /api/audit
      "level": 3 // Integer 1-5 (1=Collaborative, 5=Legal Threat)
    }
    ```

*   **Response (JSON):**
    ```json
    {
      "appeal_letter": {
        "subject": "Formal Dispute of Account #12345",
        "salutation": "To the Billing Department,",
        "body": "...",
        "call_to_action": "Please remove these charges immediately...",
        "sign_off": "Sincerely, [Patient Name]"
      }
    }
    ```
