# ClaimShield Frontend

The ClaimShield frontend is a modern, responsive **Next.js** application that provides a seamless user experience for patients to audit their medical bills. It features a high-fidelity "Glassmorphism" UI, dynamic PDF rendering, and interactive AI appeal generation.

## Tech Stack

*   **Framework:** [Next.js 14+](https://nextjs.org/) (App Router, TypeScript)
*   **Authentication:** `next-auth` for secure session management.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) (Page transitions, layout animations)
*   **PDF Rendering:** `react-pdf` for dynamic, on-screen document highlighting.
*   **PDF Generation:** `jspdf` for generating downloadable appeal letters client-side.
*   **Icons:** [Lucide React](https://lucide.dev/)

## Project Structure

*   **`app/`**: Next.js App Router directory.
    *   **`patient/`**: Patient-facing routes (Upload -> Analysis -> Results).
    *   **`insurance/`**: Insurer dashboard routes.
    *   **`login/`**: Authentication entry point.
*   **`components/`**: Reusable UI components.
*   **`lib/`**: Utility functions (e.g., tailwind class name merging via `clsx/tailwind-merge`).

## Key Features & Implementation

### 1. Patient Portal (`/patient`)
*   **Document Upload Pipeline:** Drag-and-drop interface for Clinical Notes (SOAP) and Hospital Bills.
*   **Results Dashboard (The Digitized Record):**
    *   Displays a side-by-side view comparing the flagged discrepancies natively against the source document.
    *   **PDF Highlighting:** Utilizes `react-pdf` to overlay exact bounding boxes and highlight the specific text tokens inside the uploaded PDF corresponding to upcoded/unbundled charges.
    *   **Synced Issue Drawer:** Clicking a highlighted PDF section opens a sliding animated drawer showing the CPT comparison, the RAG-suggested correction, and the price markup cost analysis.

### 2. Smart Appeal Configuration
*   **Tone Slider:** Users dynamically configure the aggression of the AI appeal letter via a 5-step slider (from "Collaborative" to "Legal Threat").
*   **Structured Rendering:** The generated appeal is rendered identically to standard business letter formatting naturally inside the browser, enforcing strict JSON-to-UI component mapping so the letter looks beautiful prior to PDF export.

### 3. Design System
*   **Theme:** Dark-mode first, utilizing slate/zinc palettes with vibrant, semantic accent gradients indicating success/warning/critical states.
*   **Glassmorphism:** Elegant use of `backdrop-blur`, semi-transparent borders, and layered z-indexes to create depth across modals and document viewers.

## Running Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
