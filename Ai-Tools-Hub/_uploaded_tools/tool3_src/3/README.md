# LLM Prompt Linter — Mini App #13

Free, single-purpose web tool for **LLM prompt linting**. Upload a prompt, schema, or API definition and get instant analysis, scoring, and guidance. No login required.

**Target keywords:** llm prompt linter tool, llm prompt linter online, llm prompt linter free

## Run locally

- **Static (fast):** Open `index.html` in a browser (e.g. Safari: File → Open File → choose `index.html`). Linting runs entirely in the client — no server needed.
- **With backend:** `npm start` then visit `http://localhost:3080` or **`http://127.0.0.1:3080`** (use 127.0.0.1 if Safari can’t connect to localhost). Optional `POST /api/lint` returns the same analysis (under 3s).

## Layout

- **Left panel:** Input type, model hint, prompt/schema/API text, “Lint prompt” CTA.
- **Center panel:** Overall score, mini metrics, results table (checks and status).
- **Right panel:** Guidance on how to interpret scores and act on results.

## Branding

- **Font:** zc regular (add `fonts/zc-regular.woff2` and uncomment `@font-face` in `styles.css`; fallback: DM Sans).
- **Accent:** `#0F766E`.
- **Sticky bottom CTA:** Links to Svivva with copy about production-ready API, tests, versioning, monitoring, cost optimization.

## Svivva connection

The tool is positioned as a lightweight preview of Svivva’s production features: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control. Primary CTA: *“You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free.”*
