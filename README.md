# OneAtlas AI Generation Pipeline

A full-stack, multi-stage, type-safe generation pipeline built on Next.js 16 and TypeScript, engineered to convert natural language instructions into functional, validated relational schemas, API endpoints, page layouts, and workflow stubs (AppSpecs).

---

## Overview

The OneAtlas AI Generation Pipeline employs a multi-stage compilation flow, processing natural language prompts sequentially through specialized extraction and generative stages. To guarantee production-ready deliverables, each pipeline stage contains a dedicated validation boundary and an automated, programmatic repair engine that corrects formatting errors, field omissions, and logical inconsistencies on the fly without raising fatal runtime failures.

---

## Features

- **Intent Extraction**: Identifies the primary application type, features, required database entities, and third-party integrations requested by the user.
- **Schema Generation**: Automatically maps out relational database tables with proper column typing, primary keys, metadata parameters, and bidirectional relations.
- **AppSpec Generation**: Synthesizes page components, roles permissions, workflow stubs, and API endpoints mapped to database resources.
- **Validation Layer**: Rigorous schemas validated using Zod at every stage boundary.
- **Repair Engine**: Dynamic three-phase recovery engine (Structural -> Field -> Consistency Repair) that auto-corrects malformed inputs and outputs.
- **Integration Registry**: Out-of-the-box configuration and template parameter checking for Slack, Gmail, WhatsApp, Stripe, and Jira.
- **SSE Streaming**: Server-Sent Events (SSE) streaming API endpoints that report real-time pipeline progress and latency directly to the front-end dashboard.
- **Cost Tracking**: Character-to-token cost estimation per pipeline step.

---

## Pipeline Architecture

```text
       User Prompt
           ↓
    Intent Extraction  ←────────┐
           ↓                    │
    [Zod Validation]            │ (Structural & Field Repair)
     ├── Success: Proceed       │
     └── Fail: ──→ Repair Engine┘
           ↓
    Schema Generation  ←────────┐
           ↓                    │
    [Zod Validation]            │ (Metadata & Bidirectional Check)
     ├── Success: Proceed       │
     └── Fail: ──→ Repair Engine┘
           ↓
   AppSpec Generation  ←────────┐
           ↓                    │
    [Zod Validation]            │ (Consistent Roles, Workflows & APIs)
     ├── Success: Proceed       │
     └── Fail: ──→ Repair Engine┘
           ↓
      Final AppSpec
```

---

## Tech Stack

- **Framework**: Next.js 16.2 (App Router with dynamic serverless streaming)
- **Language**: TypeScript (strict compilation mode)
- **Styling**: TailwindCSS (fully responsive CSS design tokens)
- **Validation**: Zod (schema verification)
- **AI Core**: Gemini API integration with programmatic fallback simulation

---

## Folder Structure

```text
├── docs/                        # Architecture & PDF Export docs
├── evaluation/                  # Pipeline evaluation results and summaries
├── scripts/                     # Helper script tools (runEvaluation.ts)
└── src/
    ├── app/                     # Next.js App Router components and routes
    │   ├── api/                 # Pipeline endpoints (generate, stream, repair)
    │   └── page.tsx             # Main dashboard visualizer
    ├── components/              # Stage progress, error logs, and spec viewers
    ├── config/                  # LLM routing parameters and cost tables
    ├── gateway/                 # API adapters and simulation engine
    ├── integrations/            # Third-party module definitions and registry
    ├── pipeline/                # Sequential stages runner execution
    ├── repair/                  # Heuristic structural, field, and consistency repair
    ├── store/                   # Global state management for job runs
    ├── types/                   # TypeScript interfaces (AppSpec, Intent, Schema)
    └── validation/              # Validator rules (Zod verification layer)
```

---

## Environment Variables

The project utilizes the following environment variable configuration:

```env
# Gemini API Key for model completions (If empty, pipeline uses local simulator fallback)
GEMINI_API_KEY=
```

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Environment
Copy the example environment file and define variables:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive pipeline dashboard.

### 4. Run Evaluation Suite
To execute the 12 standard testing scenarios and verify validation:
```bash
npx tsx scripts/runEvaluation.ts
```

---

## Deployment to Vercel

Ensure Next.js App Router compatibility and SSE stream support in production.

1. **Vercel CLI / Dashboard**:
   Import the project into your Vercel Dashboard.
2. **Environment Variables**:
   Add `GEMINI_API_KEY` to your Vercel Project Settings if calling live Google APIs.
3. **Execution Configuration**:
   The Server-Sent Events stream sets `export const dynamic = 'force-dynamic';` ensuring routes are rendered dynamically at run time and responses are not cached.

---

## Evaluation Results Summary

| Prompt / Scenario | Success | Failed Stage | Repair Strategy | Latency (Mock) | Est. Cost | Integrations |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Real Estate CRM | Yes | None | None | 17.0 ms | $0.0467 | WhatsApp |
| Task Manager | Yes | None | None | 2.0 ms | $0.0327 | Slack |
| Inventory System | Yes | None | None | 1.0 ms | $0.0413 | Gmail |
| HR Leave approval | Yes | None | None | 1.0 ms | $0.0413 | Gmail |
| Ecommerce backend | Yes | None | None | 4.0 ms | $0.0413 | Stripe, Gmail |
| Event Platform | Yes | None | None | 2.0 ms | $0.0413 | WhatsApp |
| Project Tracker | Yes | None | None | 1.0 ms | $0.0413 | Jira |
| Edge case "An app." | Yes | None | None | 2.0 ms | $0.0412 | - |
| Notion for Doctors | Yes | None | None | 1.0 ms | $0.0413 | - |
| Complex Platform | Yes | None | None | 1.0 ms | $0.0413 | Stripe |
| CRM + Invoicing | Yes | None | None | 2.0 ms | $0.0413 | Stripe |
| Smart Task Manager | Yes | None | None | 1.0 ms | $0.0413 | Slack |

*Note: Latency values listed above reflect local simulation engine results. Standard production runs over Gemini APIs average ~6.2s total duration.*

---

## Implemented Integrations

The pipeline supports and verifies connection parameters for the following modules:
1. **Slack**: Enforces channels, notification settings, and text payload formats.
2. **Gmail**: Direct email template mappings, subject headers, and address validation.
3. **WhatsApp**: Validates template structures, user mobile formatting, and hook triggers.
4. **Stripe**: Ensures invoice parameters, currency strings, and payment intent structures align.
5. **Jira**: Verifies project keys, issue types, summary limits, and webhook callbacks.

---

## Known Limitations

- **Provider Constraints**: Google Gemini API is currently the active model provider. If the Gemini API key is not configured, the gateway falls back onto the local simulation processor automatically.
