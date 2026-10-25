"""Dump every tab: full content for small tabs, head/tail for big ones."""
import sys, warnings, datetime
warnings.filterwarnings("ignore")
import openpyxl
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
BIG = 120
def fmt(v):
    if isinstance(v, datetime.datetime): return v.strftime("%Y-%m-%d")
    if isinstance(v, float): return f"{v:.6g}"
    return str(v).replace("\n", "\\n")
for ws in wb.worksheets:
    rows = [r for r in ws.iter_rows() if any(c.value is not None and str(c.value).strip() for c in r)]
    print(f"\n######## TAB {ws.title!r}  ({len(rows)} non-empty rows, dims {ws.dimensions}, state={ws.sheet_state})")
    sel = rows if len(rows) <= BIG else rows[:25] + [None] + rows[-8:]
    for r in sel:
        if r is None: print("   ...."); continue
        cells = [f"{c.coordinate}={fmt(c.value)}" for c in r if c.value is not None and str(c.value).strip()]
        print("  " + " | ".join(cells))
