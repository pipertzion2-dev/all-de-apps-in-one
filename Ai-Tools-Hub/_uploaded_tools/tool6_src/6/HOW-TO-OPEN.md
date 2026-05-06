# Open the Prompt Drift Detector (Mini App #16)

Your browser may be loading a **different app** (e.g. AI Test Case Explorer from another folder). Do one of the following:

## Option A — Open the named file (recommended)
1. In Cursor’s file explorer, go to this folder: **6**
2. **Right‑click** `prompt-drift-detector.html`
3. Choose **Open with Live Server** (or your usual “open in browser” action)

You should see a **purple bar at the top**: “Mini App #16 — Prompt Drift Detector”. That’s the correct app.

## Option B — Run the server from this folder
1. Open a terminal.
2. Run:
   ```bash
   cd "/Users/Zion/Documents/40 Cursor Apps/6"
   python3 -m http.server 8888
   ```
3. In your browser, open: **http://localhost:8888** or **http://localhost:8888/prompt-drift-detector.html**

Use port **8888** so you don’t hit another app on 8080 or 5500.

If your server root is the parent folder “40 Cursor Apps”, use: **http://localhost:PORT/6/** or **http://localhost:PORT/6/prompt-drift-detector.html**

## Option C — Open the file directly
Drag **index.html** or **prompt-drift-detector.html** from folder **6** into your browser (or use File → Open and select one of them).

---

If you still see “AI Test Case Explorer” or a different tool, you’re loading from another folder. Close that tab and use one of the options above from folder **6**.
