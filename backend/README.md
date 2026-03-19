# ClaimShield Backend API

The ClaimShield backend is a high-performance **FastAPI** application designed to handle the complex orchestration of OCR, data parsing, and LLM-based auditing. It serves as the brain of the platform, transforming raw unstructured medical documents into structured, actionable insights.

## Tech Stack

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
*   **Server:** Uvicorn
*   **AI/LLM:** OpenRouter API (Accessing models like `nvidia/nemotron-3-nano-30b-a3b:free` natively)
*   **RAG System:** `sentence-transformers` (`all-MiniLM-L6-v2`) and `scikit-learn` for semantic matching.
*   **OCR & Vector Processing:**
    *   `PyMuPDF` (fitz): For high-fidelity PDF text extraction.
    *   `Pytesseract`: For OCR on image-based uploads.
    *   `Pillow` (PIL) & `numpy`: For image and tensor manipulation.
*   **Data Management:** Local JSON databases for CPT Codes (1,164 codes) and Medicare Rates.

## LLM Architecture & OpenRouter Integration

We utilize an **Agentic Workflow** using the **OpenRouter API** to chain specialized agents. Recently, we upgraded this pipeline with **Retrieval-Augmented Generation (RAG)** to stop AI hallucinations when suggesting alternative billing codes.

### The Agent Pipeline

1.  **Invoice Extraction Agent:**
    *   **Goal:** Convert "ragged" OCR text/images of bills into standardized JSON.
    *   **Prompt:** `prompts/invoice_extraction.txt` (Strict JSON schema)
    *   **Output:** JSON object containing line items, CPT codes, and cost breakdowns.

2.  **Auditor Agent & RAG System:**
    *   **Goal:** Cross-reference clinical validity against billed items and generate definitive proof of upcoding or discrepancies.
    *   **Data Injection:** Massive context window containing the patient's Clinical Notes (SOAP), Parsed Invoice JSON, and strict instructions to extract verbatim quotes.
    *   **RAG Injection:** For every flagged "UPCODING" discrepancy, the system embeds the verbatim clinical evidence quote, vector-searches against 1,164 CPT embeddings loaded in RAM, and deterministically overwrites the AI's hallucinated suggestions with the actual nearest-neighbor CPT code.

3.  **Appeal Generator Agent:**
    *   **Goal:** Generate hyper-specific legal advocacy content based on Tone.
    *   **Mechanism:** Parses JSON from the audit and enforces one of 5 strict tone templates (ranging from *Confused Patient* to *Legal Threat*). Anti-hallucination guardrails completely forbid injecting unverified patient details.
    *   **Output:** A structured JSON object (`subject`, `salutation`, `body`, `call_to_action`, `sign_off`) ready for frontend rendering.

## API Routes

### 1. Audit Claim
**Endpoint:** `POST /api/audit`
Analyzes uploaded documents to perform a full medical bill audit.
1.  **Ingest:** Files processed via `PyMuPDF` or `Pytesseract`.
2.  **Parse:** *Invoice Agent* extracts structured data.
3.  **Audit:** *Auditor Agent* cross-references the bill vs. the notes.
4.  **RAG Match:** Cosine similarity search injects highly-accurate `suggested_cpt`.
5.  **Gouging Check:** Deterministic algorithm flags extreme markups against 1,164 Medicare rates.

### 2. Generate Appeal Letter
**Endpoint:** `POST /api/generate-appeal`
Generates a formal, 5-part JSON formatted appeal letter based on a previous audit structure. Evaluates inputs against the strict `level` 1-5 structural templates.
