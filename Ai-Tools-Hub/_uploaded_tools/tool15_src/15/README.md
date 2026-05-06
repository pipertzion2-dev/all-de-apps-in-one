# Evaluation Rule Builder — Mini App #25

Free, single-purpose web tool for **evaluation rule builder** (prompts, schemas, APIs). Targets long-tail keywords: *evaluation rule builder tool*, *evaluation rule builder online*, *evaluation rule builder free*.

- **No login**, fast load, clean three-panel layout  
- **Font:** zc regular (fallback: Outfit). To use the real “zc regular” webfont, add your font files and reference them in `styles.css`.  
- **Accent:** `#0F766E`  
- **Primary CTA:** Sticky bottom bar linking to Svivva  

## Run locally

**Static (no server):**  
Open `index.html` in a browser.

**With backend template:**  
```bash
npm start
```  
Then open http://localhost:3000  

Analysis runs client-side in under 3 seconds. To move analysis to the server, add your logic in `server.js` (e.g. a `/analyze` route) and call it from `app.js`; keep response time under 3s.

## Layout

- **Left:** Input type (prompt / schema / API), model selection, content textarea  
- **Center:** Coverage %, rule count, consistency %, suggested rules table, rule distribution chart  
- **Right:** Guidance and interpretation of results  

## Svivva CTA

Bottom bar copy:  
*“You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free.”*  
Button: **Try Svivva for free** → https://svivva.com  
