"""Compute every answer from the cleaned data (ground truth for checking the pivots)."""
import json, warnings
import pandas as pd
warnings.filterwarnings("ignore")
SRC = "input/A_questions.xlsx"
LATAM = {"Argentina", "Brazil", "Chile", "Columbia", "Peru", "Mexico"}

full = pd.read_excel(SRC, sheet_name="Data for answer 9").dropna(how="all").iloc[:, :8]
full["Discount %"] = (full["List Price"] - full["Actual Price"]) / full["List Price"]
orig = full.iloc[:2339].copy()
orig["Region"] = [("LATAM" if c in LATAM else "NA") if r == "Americas" else r for r, c in zip(orig.Region, orig.Country)]
final = full.copy()                       # Americas + the 12 added rows
orig.to_pickle("work/orig.pkl"); final.to_pickle("work/final.pkl")

out = {}
out["rows"] = {"original": len(orig), "final": len(final)}
out["Q1"] = orig.groupby("Store")["Actual Price"].sum().round(2).to_dict()
out["Q2"] = orig.groupby("Item")["Item"].count().to_dict()
q3 = orig.pivot_table(index="Item", columns="Region", values="Actual Price", aggfunc="sum", margins=True, margins_name="Grand Total")
out["Q3"] = q3.round(2).to_dict(orient="index")
sub = orig[orig.Item.isin(["Microwave", "Oven", "Refrigerator"]) & (orig.Region != "NA")]
out["Q4"] = sub.pivot_table(index="Item", columns="Region", values="Actual Price", aggfunc="sum", margins=True, margins_name="Grand Total").round(2).to_dict(orient="index")
col = orig[orig.Country == "Columbia"]
q5 = col.groupby("Salesperson")["Discount %"].agg(["mean", "count"]).sort_values("mean")
out["Q5"] = {k: {"avg": round(v["mean"], 6), "n": int(v["count"])} for k, v in q5.iterrows()}
out["Q5_overall"] = round(col["Discount %"].mean(), 6)
out["Q6"] = {f"{r}|{c}|{s}": round(v, 2) for (r, c, s), v in orig.groupby(["Region", "Country", "Store"])["Actual Price"].sum().items()}
out["Q7"] = orig.groupby("Region")["Actual Price"].sum().round(2).to_dict()
pre9 = final.iloc[:2339]
out["Q8"] = pre9.groupby("Region")["Actual Price"].sum().round(2).to_dict()
out["Q9"] = final.groupby("Region")["Actual Price"].sum().round(2).to_dict()
out["Q9_added"] = final.iloc[2339:].groupby("Region")["Actual Price"].sum().to_dict()
out["Q10"] = final[final.Country == "USA"].groupby("Store")["Actual Price"].sum().to_dict()
out["totals"] = {"orig_revenue": orig["Actual Price"].sum(), "final_revenue": final["Actual Price"].sum()}
json.dump(out, open("work/answers.json", "w"), indent=1, default=float)
for k, v in out.items():
    print(k, json.dumps(v, default=float)[:900])
