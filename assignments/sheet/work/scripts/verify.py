"""Compare every pivot output in the workbook with the pandas ground truth."""
import json, sys, warnings
import openpyxl
warnings.filterwarnings("ignore")
A = json.load(open("work/answers.json"))
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
fails = 0
def rows(n):
    return [r[:6] for r in wb[f"Q{n}"].iter_rows(min_row=2, values_only=True) if any(v is not None for v in r[:6])]
def check(label, got, want):
    global fails
    ok = abs(float(got) - float(want)) < 1e-6
    fails += not ok
    if not ok: print("FAIL", label, got, want)
def two_col(n, key):
    body = {r[0]: r[1] for r in rows(n) if r[0] not in (None, "Filter", "Country", "Store", "Item", "Salesperson")}
    exp = A[key]
    if isinstance(next(iter(exp.values())), dict): exp = {k: v["avg"] for k, v in exp.items()}
    extra = set(body) - set(exp) - {"Total Result"}
    if extra: print("FAIL extra rows", n, extra); 
    for k, v in exp.items(): check(f"Q{n} {k}", body.get(k, "nan"), v)
    return body, len(extra)
b, e = two_col(1, "Q1"); check("Q1 total", b["Total Result"], A["totals"]["orig_revenue"])
b, e = two_col(2, "Q2"); check("Q2 total", b["Total Result"], 2339)
for n in (3, 4):
    rr = rows(n); hdr = next(r for r in rr if r[0] == "Item")
    for r in rr[rr.index(hdr) + 1:]:
        name = "Grand Total" if r[0] == "Total Result" else r[0]
        for col, v in zip(hdr[1:], r[1:]):
            if col is None: continue
            col = "Grand Total" if col == "Total Result" else col
            check(f"Q{n} {name}/{col}", v, A[f"Q{n}"][name][col])
    print(f"Q{n} columns:", [c for c in hdr if c])
b, e = two_col(5, "Q5"); check("Q5 overall", b["Total Result"], A["Q5_overall"])
print("Q5 order:", [r[0] for r in rows(5)[3:6]], "filter:", rows(5)[1])
r6 = rows(6); region = country = None; n6 = 0
for r in r6[2:]:
    if r[0] == "Total Result": check("Q6 total", r[3], A["totals"]["orig_revenue"]); continue
    region = r[0] or region; country = r[1] or country
    check(f"Q6 {region}/{country}/{r[2]}", r[3], A["Q6"][f"{region}|{country}|{r[2]}"]); n6 += 1
print("Q6 store rows:", n6, "expected", len(A["Q6"]))
for n, key, tot in ((7, "Q7", A["totals"]["orig_revenue"]), (8, "Q8", A["totals"]["orig_revenue"]), (9, "Q9", A["totals"]["final_revenue"])):
    body = {r[0]: r[3] for r in rows(n)[2:]}
    assert set(body) - {"Total Result"} == set(A[key]), (n, body.keys())
    for k, v in A[key].items(): check(f"Q{n} {k}", body[k], v)
    check(f"Q{n} total", body["Total Result"], tot)
b, e = two_col(10, "Q10"); print("Q10 filter:", rows(10)[1])
print("FAILURES:", fails)
