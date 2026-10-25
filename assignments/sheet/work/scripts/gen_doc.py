"""Write the answer document (Parts A + C) as Markdown from the verified answers."""
import json
A = json.load(open("work/answers.json"))
money = lambda v: f"${v:,.0f}"
L = []
w = L.append

def table(header, rows, align=None):
    w("| " + " | ".join(header) + " |")
    w("|" + "|".join(align or ["---"] + ["---:"] * (len(header) - 1)) + "|")
    for r in rows:
        w("| " + " | ".join(str(c) for c in r) + " |")
    w("")

w("# Pivot Table Assignment: Home Appliances Retailer\n")
w("All pivot tables are in the accompanying workbook (*Pivot_Table_Assignment_Solution.xlsx*), one tab per question. "
  "Sales figures are the sum of **Actual Price** (the price the customer paid). Q1–Q7 use the data as supplied "
  f"({A['rows']['original']:,} transactions); Q8–Q11 use the data after the region rename and the 12 added rows "
  f"({A['rows']['final']:,} transactions). Store, city and country names are spelled as they appear in the data.\n")

w("## Question 1: How much in $ did you sell in each city?\n")
w("Pivot: **Store** in Rows, **Sum of Actual Price** in Values. Moscow was the strongest store and Rochester the weakest.\n")
q1 = sorted(A["Q1"].items())
half = (len(q1) + 1) // 2
rows = []
for i in range(half):
    a = q1[i]; b = q1[i + half] if i + half < len(q1) else ("", "")
    rows.append([a[0], money(a[1]), b[0], money(b[1]) if b[0] else ""])
table(["City (store)", "Sales", "City (store)", "Sales"], rows, ["---", "---:", "---", "---:"])
w(f"**Total sales: {money(A['totals']['orig_revenue'])}** across {len(q1)} cities.\n")

w("## Question 2: Per each home appliance item, how many items were sold by your company?\n")
w("Pivot: **Item** in Rows, **Count of Item** in Values (each row of data is one item sold).\n")
table(["Item", "Items sold"], [[k, f"{v:,}"] for k, v in sorted(A["Q2"].items())] + [["**Total**", f"**{A['rows']['original']:,}**"]])
top = max(A["Q2"], key=A["Q2"].get); low = min(A["Q2"], key=A["Q2"].get)
w(f"Irons sold most often ({A['Q2'][top]}) and dishwashers least often ({A['Q2'][low]}).\n")

regs = ["APAC", "EMEA", "LATAM", "NA"]
w("## Question 3: Total revenue by item (rows) and region (columns)\n")
w("Pivot: **Item** in Rows, **Region** in Columns, **Sum of Actual Price** in Values. "
  "NA covers the USA and Canada; LATAM covers Mexico, Brazil, Argentina, Chile, Columbia and Peru.\n")
q3 = A["Q3"]
items = sorted(k for k in q3 if k != "Grand Total")
table(["Item"] + regs + ["Total"], [[i] + [money(q3[i][r]) for r in regs] + [money(q3[i]["Grand Total"])] for i in items]
      + [["**Total**"] + [f"**{money(q3['Grand Total'][r])}**" for r in regs] + [f"**{money(q3['Grand Total']['Grand Total'])}**"]],
      ["-" * 16] + ["----------:"] * 5)
w("Refrigerators earned the most revenue and EMEA was the largest region, with about 45% of all sales.\n")

w("## Question 4: Show only Microwave, Oven and Refrigerator, and remove NA\n")
w("On the Q3 pivot, the **Item** filter keeps only Microwave, Oven and Refrigerator, and **NA** is unticked in the **Region** filter.\n")
q4 = A["Q4"]; r4 = ["APAC", "EMEA", "LATAM"]
table(["Item"] + r4 + ["Total"], [[i] + [money(q4[i][r]) for r in r4] + [money(q4[i]["Grand Total"])] for i in ["Microwave", "Oven", "Refrigerator"]]
      + [["**Total**"] + [f"**{money(q4['Grand Total'][r])}**" for r in r4] + [f"**{money(q4['Grand Total']['Grand Total'])}**"]])

w("## Question 5: Average discount % per salesperson in Columbia, ascending. Who is the best sales agent?\n")
w("Pivot: **Country** as a report (external) filter set to Columbia, **Salesperson** in Rows, **Average of Discount %** in Values, "
  "sorted smallest to largest. Discount % = (List Price − Actual Price) ÷ List Price.\n")
table(["Salesperson", "Average discount", "Sales in Columbia"], [[k, f"{v['avg']:.2%}", v["n"]] for k, v in A["Q5"].items()]
      + [["**All Columbia sales**", f"**{A['Q5_overall']:.2%}**", f"**{sum(v['n'] for v in A['Q5'].values())}**"]])
w("**Best sales agent: Gary Percival.** He has the lowest average discount (6.83%), so his sales came closest to the list price "
  "and gave away the least margin. He made only two sales in Columbia, though. David Finnie (8.16% across six sales) "
  "is the most consistent low-discount seller.\n")

w("## Question 6: Sales report by Region, Country and Store\n")
w("Pivot: **Region**, **Country** and **Store** in Rows (tabular layout, so each field has its own column), "
  "**Sum of Actual Price** in Values, with Country and Store subtotals turned off.\n")
rows = []; last = (None, None)
for key, v in A["Q6"].items():
    reg, cty, st = key.split("|")
    rows.append([reg if reg != last[0] else "", cty if (reg, cty) != last else "", st, money(v)])
    last = (reg, cty)
rows.append(["**Total**", "", "", f"**{money(A['totals']['orig_revenue'])}**"])
table(["Region", "Country", "Store", "Sales"], rows, ["---", "---", "---", "---:"])

w("## Question 7: Show the Q6 pivot by Region only, without removing any field\n")
w("Collapse the Region field. Right-click any Region label and choose **Expand/Collapse → Collapse Entire Field** "
  "(Microsoft, n.d.-b), or click the **−** button beside each region. Country and Store stay in the Rows area but are hidden, "
  "so **Expand Entire Field** brings them straight back.\n")
table(["Region", "Sales"], [[k, money(v)] for k, v in sorted(A["Q7"].items())] + [["**Total**", f"**{money(A['totals']['orig_revenue'])}**"]])

w("## Question 8: Combine NA and LATAM into \"Americas\"\n")
w("In the data, select the **Region** column and use **Find & Replace** with *Match entire cell contents* ticked: "
  "replace `NA` with `Americas`, then `LATAM` with `Americas` (745 rows in total). Matching the entire cell means only "
  "cells that read exactly NA or LATAM change. Then refresh the pivot (**PivotTable Analyze → Refresh**).\n")
table(["Region", "Sales"], [[k, money(v)] for k, v in sorted(A["Q8"].items(), key=lambda x: x[0].lower())] + [["**Total**", f"**{money(A['totals']['orig_revenue'])}**"]])
w(f"Americas = NA ({money(A['Q7']['NA'])}) + LATAM ({money(A['Q7']['LATAM'])}) = {money(A['Q8']['Americas'])}, so no sales were lost in the rename.\n")

w("## Question 9: Add the 12 omitted APAC and EMEA transactions\n")
w("The 12 rows were pasted directly under the last row of data (rows 2,341–2,352), in the same column order. "
  "Discount % was not typed in. It is calculated as (List Price − Actual Price) ÷ List Price, which gives the same values as the sheet. "
  "A pivot does not pick up new rows below its source range by itself, so the source was widened with "
  "**PivotTable Analyze → Change Data Source** to `Data!$A$1:$I$2352`, and the pivot was refreshed (Microsoft, n.d.-a). "
  "Formatting the data as an Excel Table first (Ctrl + T) would make future rows join the pivot automatically on refresh.\n")
added = A["Q9_added"]
table(["Region", "Before (Q8)", "Added", "After (Q9)"],
      [[k, money(A["Q8"][k]), money(added.get(k, 0)), money(A["Q9"][k])] for k in sorted(A["Q9"], key=str.lower)]
      + [["**Total**", f"**{money(A['totals']['orig_revenue'])}**", f"**{money(sum(added.values()))}**", f"**{money(A['totals']['final_revenue'])}**"]])
w("The five APAC rows add $764 and the seven EMEA rows add $637, which confirms that all 12 transactions are included.\n")

w("## Question 10: Pie chart of $ sales per store in the USA\n")
w("Pivot: **Country** as a report filter set to USA, **Store** in Rows, **Sum of Actual Price** in Values, "
  "plotted as a pie chart (**PivotTable Analyze → PivotChart → Pie**).\n")
usa = A["Q10"]; tot = sum(usa.values())
table(["Store", "Sales", "Share"], [[k, money(v), f"{v / tot:.1%}"] for k, v in sorted(usa.items())] + [["**Total**", f"**{money(tot)}**", "**100%**"]])
w("![Pie chart of sales per store in the USA](q10_pie.png){ width=4.2in }\n")
w("San Fransisco, Los Angeles and Kansas City each bring in about 17% of US sales. Houston and Rochester together make up less than 8%.\n")

w("## Question 11: Add a slicer that filters the chart by Item\n")
w("Click inside the Q10 pivot table, go to **Insert → Slicer**, tick **Item** and click **OK** "
  "(Microsoft, n.d.-c). The slicer is connected to the pivot table, and the PivotChart is built on that pivot table. "
  "So clicking an item in the slicer, for example *Refrigerator*, redraws the pie to show only that item's sales per US store. "
  "Holding Ctrl selects several items, and the *Clear Filter* button on the slicer shows all items again.\n")

w("## References\n")
w("Microsoft. (n.d.-a). *Change the source data for a PivotTable*. Microsoft Support. "
  "https://support.microsoft.com/en-us/office/change-the-source-data-for-a-pivottable-afd93524-f7de-432c-84d0-3896fbbc2577\n")
w("Microsoft. (n.d.-b). *Expand, collapse, or show details in a PivotTable or PivotChart*. Microsoft Support. "
  "https://support.microsoft.com/en-us/office/expand-collapse-or-show-details-in-a-pivottable-or-pivotchart-d70d7e70-d230-4d45-81db-1f5e39bcb394\n")
w("Microsoft. (n.d.-c). *Use slicers to filter data*. Microsoft Support. "
  "https://support.microsoft.com/en-us/office/use-slicers-to-filter-data-249f966b-a9d5-4b0f-b31a-12651785d29d\n")
open("output/assignment.md", "w").write("\n".join(L))
print("written", len(L), "lines")
