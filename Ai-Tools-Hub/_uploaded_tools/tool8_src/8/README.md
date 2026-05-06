# Model Switch Simulator (Mini App #18)

Free, single-purpose web tool for **model switch simulator**–style workflows. Upload a prompt, schema, or API definition and get instant analysis: compatibility, token estimates, and cost across GPT-4, Claude, and Gemini. No login required.

## Target keywords

- model switch simulator tool  
- model switch simulator online  
- model switch simulator free  

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Analysis runs in under 3 seconds.

## Stack

- **Backend:** Node (Express), single `/api/analyze` POST endpoint.  
- **Frontend:** Vanilla HTML/CSS/JS, three-panel layout, accent `#9333EA`, zc regular font site-wide.  
- **CTA:** Sticky bottom bar linking to [Svivva](https://svivva.com) with production-API positioning.

## Connection to Svivva

This tool is a lightweight preview of Svivva’s production platform: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control. The primary CTA invites users to turn a single prompt test into a production-ready API.
