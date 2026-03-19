# ClaimShield Frontend

The ClaimShield frontend is a modern, responsive **Next.js** application that provides a seamless user experience for both patients and insurers. It features a high-fidelity "Glassmorphism" UI, complex state management for document auditing, and interactive data visualization.

## Tech Stack

*   **Framework:** [Next.js 14+](https://nextjs.org/) (App Router, TypeScript)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) (Page transitions, micro-interactions, layout animations)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Visualization:** [Recharts](https://recharts.org/) (For insurer dashboard metrics)
*   **PDF Generation:** `jspdf` (For generating downloadable appeal letters client-side)

## Project Structure

*   **`app/`**: Next.js App Router directory.
    *   **`patient/`**: Patient-facing routes (Upload -> Analysis -> Results).
    *   **`insurance/`**: Insurer dashboard routes (`page.tsx` contains the main dashboard).
    *   **`login/`**: Authentication entry point.
*   **`components/`**: Reusable UI components.
*   **`lib/`**: Utility functions (e.g., class name merging).

## Key Features & Implementation

### 1. Patient Portal (`/patient`)
*   **Two-Stage Workflow:**
    *   **Upload:** Handles file inputs for Clinical Notes and Hospital Bills.
    *   **Results:** Displays the "Digitized Record" view.
*   **Side-by-Side Comparison:**
    *   Implements a custom synced-scroll view (or efficient toggle) to compare extracted clinical text against billed items.
*   **Interactive Appeal Configuration:**
    *   Users can select an "Aggression Level" (1-5) via a slider.
    *   This state is passed to the backend to generate a tailored appeal letter.

### 2. Insurer Dashboard (`/insurance`)
*   **Data Visualization:**
    *   Uses `Recharts` to render:
        *   **Price Gouging Heatmaps:** By zip code.
        *   **Flag Rate Trends:** Bar charts showing top offending hospitals.
*   **Real-time Filtering:**
    *   The dashboard allows filtering by specific medical codes or geographic regions.

### 3. Design System
*   **Theme:** Dark-mode first, utilizing slate/zinc palettes with vibrant accent gradients (Blue/Cyan/Purple).
*   **Glassmorphism:** Heavy use of `backdrop-blur`, semi-transparent borders, and layered z-indexes to create depth.

## Running Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
