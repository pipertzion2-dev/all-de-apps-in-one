# Open the API Latency Forecaster

Try these in order:

## 1. Double-click the HTML file
- In Finder, go to: **Documents → 40 Cursor Apps → 4**
- Double-click **API-Latency-Forecaster.html**
- It should open in your default browser.

## 2. Open from Terminal
```bash
open "/Users/Zion/Documents/40 Cursor Apps/4/API-Latency-Forecaster.html"
```

## 3. Use a local server (if the file doesn’t load properly)
In Terminal, run:
```bash
cd "/Users/Zion/Documents/40 Cursor Apps/4"
python3 -m http.server 8888
```
Then in your browser go to: **http://localhost:8888/API-Latency-Forecaster.html**

(Press Ctrl+C in Terminal to stop the server when done.)

## Using the tool
1. Type or paste some text in the **Prompt** box (or leave it blank).
2. Click **Forecast latency**.
3. The score, chart, and suggestions appear in the center and right panels.
