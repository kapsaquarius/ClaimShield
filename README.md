# ClaimShield

## Inspiration
Medical billing in the US is notoriously opaque, error-prone, and often predatory. Patients are frequently hit with "surprise bills," upcoded services, or charges for procedures that never happened ("phantom charges"). On the flip side, insurance companies lose billions annually to fraudulent claims. We were inspired to build **ClaimShield** to bridge this gap—empowering patients with AI-driven advocacy tools while giving insurers the observability they need to detect systemic fraud. We wanted to demystify medical bills and bring transparency to healthcare costs.

## What it does
ClaimShield operates in two distinct modes:

**1. Patient Mode (The Advocate)**
*   **Document Analysis:** Patients upload their "Clinical Notes" (SOAP notes) and "Hospital Bills" (PDFs or Images).
*   **AI Audit:** Our system digitizes these documents and cross-references them using an Agentic LLM workflow and a comprehensive 1,164-item CPT code database.
*   **Discrepancy Detection:** It automatically flags inconsistencies such as:
    *   **Upcoding:** Billing for a higher level of service than supported by the notes. Highly-accurate alternative codes are suggested via a Retrieval-Augmented Generation (RAG) system.
    *   **Phantom Charges:** Billing for services not mentioned in the clinical records.
    *   **Price Gouging:** Identifying charges significantly higher than standard Medicare rates using a deterministic lookup.
*   **Actionable Recourse:** Users can generate formal, JSON-structured appeal letters with customizable tones—from "Collaborative" to "Legal Threat"—to cleanly export and contest invalid charges.

**2. Insurer Mode (The Watchdog)**
*   **Observability Dashboard:** A high-level view for insurance companies to monitor billing data.
*   **Fraud Detection:** Visualizes metrics by zip code to identify hotspots for fraudulent activity.
*   **Provider Analysis:** Detailed breakdown of specific hospitals and doctors, highlighting frequent offenders and deviation from average costs.

## How we built it
We built ClaimShield using a modern, scalable full-stack architecture:

*   **Frontend:** Built with **Next.js 14** (TypeScript, App Router) for a responsive UI. We used **Tailwind CSS** for styling, **Framer Motion** for smooth glassmorphic interactions, **react-pdf** for dynamic document bounding-box highlighting, and **Recharts** for data visualizations.
*   **Backend:** A robust **FastAPI** (Python 3.9+) server handles the heavy lifting, asynchronous file parsing, and LLM orchestration.
*   **AI & Logic:**
    *   **Agentic Pipeline:** Utilized the **OpenRouter API** to chain specialized agents (Invoice Parse → RAG Auditor → Appeal Generator).
    *   **RAG Engine:** Implemented local semantic similarity using `sentence-transformers` (`all-MiniLM-L6-v2`) and `scikit-learn` to prevent LLM hallucination. When the LLM flags an upcoded item, it pulls the verbatim quote from the doctor's notes, embeds it, and mathematically finds the true nearest-neighbor CPT code.
    *   **OCR & Parsing:** Integrated **PyMuPDF**, **Pytesseract**, and **Pillow** to extract text and spatial bounding-boxes from diverse file formats.
    *   **Strict Prompt Engineering:** Designed hyper-specialized prompts detailing complex anti-hallucination rules and structural JSON constraints for perfect UI rendering.
*   **Data:** Built local JSON databases tracking **1,164 CPT codes and Medicare Rates**, ensuring fast, offline-capable deterministic cost analysis.

## Challenges we ran into
*   **Unstructured Data:** Medical bills come in thousands of formats. Getting the AI to reliably parse "ragged" text from OCR output into structured JSON was a significant hurdle.
*   **Hallucinations:** Early versions of the model would invent CPT codes or format letters with placeholders like `[Account Number]`. We solved this by grounding the model with a dense local RAG database, and writing strict anti-hallucination prompt layers that force the LLM to rewrite sentences organically when data is missing.
*   **JSON API Constraints:** Wrangling smaller models (like Nemotron-3) to return beautiful plain-text letters when the global Application Layer requested `json_objects` caused system crashes. We resolved this by forcing the LLM to write the letter perfectly contained within 5 specific JSON keys to satisfy both the Backend and Frontend state needs.
*   **Context Window Limits:** Clinical notes can be dozens of pages long. We had to implement efficient text extraction and chunking strategies.
*   **UI Complexity:** Presenting a "diff" between a messy scanned bill and a clean digital record required creative UI design, resulting in our side-by-side "Digitized Record" view using `react-pdf` overlaid with targeted CSS highlights.

## Accomplishments that we're proud of
*   **Empowering Patients** - Giving users hard data (like authentic Medicare reference rates) changes the power dynamic completely when fighting hospital billing departments.
*   **End-to-End Flow:** Successfully taking a raw image of a bill and a PDF of notes, running OCR, extracting bounding boxes, passing them through an Agent pipeline, injecting RAG corrections, and outputting an interactive view in under a minute.
*   **Dynamic Appeal Generation:** The ability to instantly generate an aggressively precise, legally-sound appeal letter strictly citing "Billed CPT vs. Verbatim Evidence Quote".
*   **Full-Stack Polish:** We are exceptionally proud of the breathtaking glassmorphic design and deeply interactive experience built entirely during the hackathon.

## What we learned
*   **The Depth of the Problem:** During our research, we learned just how pervasive billing errors and hospital margin inflation are.
*   **LLMs as Translators:** LLMs are phenomenal at translating between "Medical Jargon" (Doctor's notes) and "Billing Codes" (CPT), acting as a universal, structured interpreter.
*   **The Power of RAG:** Combining LLM reasoning with mathematical local embeddings provides the ultimate balance of intelligence and factual safety.
