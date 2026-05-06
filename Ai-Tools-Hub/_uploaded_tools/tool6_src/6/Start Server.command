#!/bin/bash
cd "$(dirname "$0")"
PORT=5999
# Start server in background, open browser, then wait so server keeps running
/usr/bin/python3 -m http.server $PORT &
SERVER_PID=$!
sleep 2
open "http://localhost:$PORT"
echo ""
echo "  Server running at http://localhost:$PORT"
echo "  Keep this window open. Close it or press Control+C to stop."
echo ""
wait $SERVER_PID
