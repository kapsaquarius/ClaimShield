# ClaimShield

## Inspiration
Medical billing in the US is notoriously opaque, error-prone, and often predatory. Patients are frequently hit with "surprise bills," upcoded services, or charges for procedures that never happened ("phantom charges"). On the flip side, insurance companies lose billions annually to fraudulent claims. We were inspired to build **ClaimShield** to bridge this gap—empowering patients with AI-driven advocacy tools while giving insurers the observability they need to detect systemic fraud. We wanted to demystify medical bills and bring transparency to healthcare costs.

## What it does
ClaimShield operates in two distinct modes:

**1. Patient Mode (The Advocate)**
*   **Document Analysis:** Patients upload their "Clinical Notes" (SOAP notes) and "Hospital Bills" (PDFs or Images).
*   **AI Audit:** Our system digitizes these documents and cross-references them using an LLM and a comprehensive CPT code database.
*   **Discrepancy Detection:** It automatically flags inconsistencies such as:
    *   **Upcoding:** Billing for a higher level of service than supported by the notes.
    *   **Phantom Charges:** Billing for services not mentioned in the clinical records.
    *   **Price Gouging:** Identifying charges significantly higher than standard Medicare rates.
*   **Actionable Recourse:** Users can generate formal appeal letters with customizable tones—from "Confused Patient" to "Legal Threat"—to contest invalid charges.

**2. Insurer Mode (The Watchdog)**
*   **Observability Dashboard:** A high-level view for insurance companies to monitor billing data.
*   **Fraud Detection:** Visualizes metrics by zip code to identify hotspots for fraudulent activity.
*   **Provider Analysis:**Detailed breakdown of specific hospitals and doctors, highlighting frequent offenders and deviation from average costs (Medicare rates).

## How we built it
We built ClaimShield using a modern, scalable tech stack:

*   **Frontend:** Built with **Next.js** (TypeScript) for a responsive and server-rendered UI. We used **Tailwind CSS** for styling, **Framer Motion** for smooth interactions, and **Recharts** for the data visualizations in the insurer dashboard.
*   **Backend:** A robust **FastAPI** (Python) server handles the heavy lifting.
*   **AI & Logic:**
    *   **LLM Integration:** utilized **OpenRouter API** to access powerful models for understanding complex medical text.
    *   **OCR & Parsing:** Integrated **PyMuPDF**, **Pytesseract**, and **Pillow** to extract text from diverse file formats (scanned PDFs, images).
    *   **Prompt Engineering:** Designed specialized prompts (`invoice_extraction.txt`, `audit_claim.txt`, `appeal_letter.txt`) to enforce strict JSON outputs and accurate reasoning.
*   **Data:** Implemented local databases for CPT codes and Medicare rates to ensure fast, offline-capable reference checks.

## Challenges we ran into
*   **Unstructured Data:** Medical bills come in thousands of formats. Getting the AI to reliably parse "ragged" text from OCR output into structured JSON was a significant hurdle.
*   **Hallucinations:** Early versions of the model would sometimes invent CPT codes. We solved this by grounding the model with a verified local database of Official CPT Definitions and Medicare rates.
*   **Context Window Limits:** Clinical notes can be dozens of pages long. We had to implement efficient text extraction and chunking strategies to fit relevant information into the context window.
*   **UI Complexity:** Presenting a "diff" between a messy scanned bill and a clean digital record required creative UI design, resulting in our side-by-side "Digitized Record" view.

## Accomplishments that we're proud of
* **Solving a real pain point for patients** - Medical billing is a complex and often unfair process. ClaimShield helps patients fight back against unfair medical bills.
*   **End-to-End Flow:** Successfully taking a raw image of a bill and a PDF of notes, and outputting a fully reasoned audit report in under a minute.
*   **Dynamic Appeal Generation:** The ability to instantly generate a legally-sound appeal letter based on the specific discrepancies found in the audit.
*   **Price Gouging Detection:** The logic that compares charged amounts vs. Medicare rates gives users immediate, quantifiable leverage.
*   **The UI:** We are particularly proud of the amazing design and smooth animations that make a stressful topic (medical bills) feel approachable and manageable. We are also proud of the fact that we were able to build this project in just 24 hours.

## What we learned
*   **The Depth of the Problem:** During our research, we learned just how pervasive billing errors are
*   **LLMs as Translators:** LLMs are excellent at translating between "Medical Jargon" (Doctor's notes) and "Billing Codes" (CPT), acting as a universal interpreter.
*   **User Empowerment:** Giving users data (like Medicare reference rates) changes the power dynamic completely when they speak to billing departments.

## What's next for ClaimShield
*   **EHR Integration:** Connecting directly to patient portals (Epic, MyChart) to pull clinical notes automatically.
*   **Batch Processing for Insurers:** Scaling the backend to handle thousands of claims simultaneously for real-time fraud detection.
*   **Mobile App:** A native application to let users snap photos of bills directly from their phone.
*   **Legal Partner Network:** A "Connect to Lawyer" button for cases where the specialized "Legal Threat" letter isn't enough.
* **HIPAA Compliance:** Ensuring that the application is compliant with HIPAA regulations.
