# Architectural Design Decisions (ADRs)

## ADR 1: Next.js 15 Routing Signature Compatibility
- **Context**: In Next.js 15, dynamic route parameters (like `params`) are resolved asynchronously.
- **Decision**: Await `params` in all route handlers (e.g. `const { jobId } = await params;`) to comply with Next.js 15 TypeScript strict typing and avoid run-time routing issues.

## ADR 2: Global JobStore for Hot-Reload Environments
- **Context**: During development, Next.js hot-reloads modules, which wipes out standard file-scoped static variables and in-memory Map stores.
- **Decision**: Persist the `jobStoreInstance` in `globalThis` using a unique symbol reference. This allows full in-memory job states, logs, and SSE listeners to survive code updates.

## ADR 3: Progressive Programmatic Repairs over Blind Retries
- **Context**: LLM completions can contain syntax errors or omit properties. Making another LLM query for simple syntax or missing metadata wastes cost and latency.
- **Decision**: Perform programmatic fixes first. Structural corrections (JSON bracket stacks) and consistency adjustments (mapping missing endpoints, syncing security roles) are handled instantly and deterministically. If those fail, the system escalates the issue rather than making endless blind retries.

## ADR 4: Gateway Isolation and Simulation Engine Fallback
- **Context**: Pipeline stages should remain decoupled from API keys and physical model targets.
- **Decision**: Keep adapters hidden behind the `AIProvider` interface. If API credentials (`OPENAI_API_KEY`, etc.) are absent, the adapters dynamically use `SimulatorEngine` matching to return structured JSON configurations for the evaluation test cases.
