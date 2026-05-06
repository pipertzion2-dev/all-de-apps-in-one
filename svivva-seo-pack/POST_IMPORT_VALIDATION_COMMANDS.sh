#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash POST_IMPORT_VALIDATION_COMMANDS.sh https://svivva.com
# If omitted, defaults to https://svivva.com

BASE_URL="${1:-https://svivva.com}"
BASE_URL="${BASE_URL%/}"

echo "== Svivva SEO Validation =="
echo "Base URL: ${BASE_URL}"
echo

echo "1) Core endpoint health"
curl -s -o /dev/null -w "robots.txt => %{http_code}\n" "${BASE_URL}/robots.txt"
curl -s -o /dev/null -w "sitemap index => %{http_code}\n" "${BASE_URL}/sitemap.xml"
curl -s -o /dev/null -w "sitemap chunk #1 => %{http_code}\n" "${BASE_URL}/sitemaps/1.xml"
echo

echo "2) robots.txt + sitemap preview"
echo "-- robots.txt (first 20 lines) --"
curl -s "${BASE_URL}/robots.txt" | sed -n '1,20p'
echo
echo "-- sitemap.xml (first 30 lines) --"
curl -s "${BASE_URL}/sitemap.xml" | sed -n '1,30p'
echo

echo "3) Canonical checks (homepage/blog/sample post)"
for URL in \
  "${BASE_URL}" \
  "${BASE_URL}/blog" \
  "${BASE_URL}/blog/how-to-build-an-api-without-writing-code-in-2025"
do
  echo "URL => ${URL}"
  curl -s "${URL}" | sed -n '1,240p' | grep -i "rel=\"canonical\"" || echo "canonical not found in first HTML chunk"
  echo
done

echo "4) Run app-level SEO audit script"
echo "Command:"
echo "  npx tsx scripts/seo-audit.ts ${BASE_URL}"
echo

echo "5) Optional: quick status sample from first sitemap chunk"
echo "  (run after audit if needed)"
cat <<'EOF'
python3 - <<'PY'
import requests, re
from xml.etree import ElementTree as ET
base="https://svivva.com"
xml=requests.get(base+"/sitemaps/1.xml",timeout=20).text
root=ET.fromstring(xml)
ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
urls=[u.find("s:loc",ns).text for u in root.findall("s:url",ns)[:25]]
bad=[]
for u in urls:
    try:
        r=requests.get(u,timeout=20)
        if r.status_code!=200:
            bad.append((u,r.status_code))
    except Exception:
        bad.append((u,"ERR"))
print("checked",len(urls),"non200",len(bad))
for row in bad[:10]:
    print(row[1],row[0])
PY
EOF
echo

echo "Done. If high-priority issues remain, fix canonicals/robots/sitemap consistency first."
