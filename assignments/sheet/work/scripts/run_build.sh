#!/usr/bin/env bash
# Full rebuild of the solution workbook. A fresh LibreOffice is started for each step
# because a long-running instance stops applying pivot report filters reliably.
set -euo pipefail
cd "$(dirname "$0")/../.."
fresh_office() {
  pkill -x soffice.bin 2>/dev/null || true
  sleep 2
  (soffice --headless --invisible --norestore --accept="socket,host=localhost,port=2002;urp;" >/dev/null 2>&1 &)
  sleep 5
}
python3 -I work/scripts/compute.py >/dev/null
python3 -I work/scripts/build_base.py
# LibreOffice applies pivot report filters intermittently; retry until a build passes the checks
rm -f work/pivots.xlsx
for attempt in 1 2 3 4 5 6 7 8; do
  fresh_office
  if python3 work/scripts/make_pivots.py work/base.xlsx work/pivots.xlsx; then break; fi
  echo "attempt $attempt failed, retrying"
done
test -f work/pivots.xlsx
python3 -I work/scripts/fix_xml.py work/pivots.xlsx output/Pivot_Table_Assignment_Solution.xlsx
python3 -I work/scripts/verify.py output/Pivot_Table_Assignment_Solution.xlsx
fresh_office
python3 work/scripts/roundtrip.py output/Pivot_Table_Assignment_Solution.xlsx work/roundtrip.xlsx
python3 -I work/scripts/verify.py work/roundtrip.xlsx | tail -1
python3 work/scripts/to_pdf.py output/Pivot_Table_Assignment_Solution.xlsx work/render/preview.pdf
pkill -x soffice.bin 2>/dev/null || true
