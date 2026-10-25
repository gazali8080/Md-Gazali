"""Create real pivot tables (and the Q10 pivot chart) with LibreOffice UNO, save as .xlsx.

Run with LibreOffice listening:  soffice --headless --accept="socket,host=localhost,port=2002;urp;" &
Usage: python3 make_pivots.py <in.xlsx> <out.xlsx>
"""
import os
import sys
import time

import uno
from com.sun.star.awt import Rectangle
from com.sun.star.beans import PropertyValue
from com.sun.star.sheet.DataPilotFieldOrientation import COLUMN, DATA, PAGE, ROW
from com.sun.star.sheet import DataPilotFieldLayoutInfo, DataPilotFieldSortInfo
from com.sun.star.table import CellAddress

GF = lambda n: uno.Enum("com.sun.star.sheet.GeneralFunction", n)
SORT_DATA = uno.getConstantByName("com.sun.star.sheet.DataPilotFieldSortMode.DATA")
TABULAR = uno.getConstantByName("com.sun.star.sheet.DataPilotFieldLayoutMode.TABULAR_LAYOUT")
COLS = ["Store", "Country", "Region", "Date", "Item", "Salesperson", "List Price", "Actual Price", "Discount %"]


def connect():
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
    for _ in range(40):
        try:
            ctx = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            return ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        except Exception:
            time.sleep(0.5)
    raise SystemExit("could not connect to soffice")


def prop(name, value):
    p = PropertyValue(); p.Name = name; p.Value = value
    return p


def pivot(doc, sheet_name, name, src_sheet, last_row, rows=(), cols=(), page=None, data=None,
          func="SUM", at=(0, 2), tabular=False, no_subtotals=(), hide=None, collapse=None,
          sort_desc=None, grand_cols=True, fmt="$#,##0", expect=None):
    sheets = doc.Sheets
    sheet = sheets.getByName(sheet_name)
    tables = sheet.getDataPilotTables()
    desc = tables.createDataPilotDescriptor()
    desc.setSourceRange(sheets.getByName(src_sheet).getCellRangeByName(f"A1:I{last_row}").getRangeAddress())
    desc.ColumnGrand = grand_cols
    desc.RowGrand = True
    fields = desc.getDataPilotFields()
    for f in rows:
        fields.getByIndex(COLS.index(f)).Orientation = ROW
    for f in cols:
        fields.getByIndex(COLS.index(f)).Orientation = COLUMN
    if page:
        fields.getByIndex(COLS.index(page[0])).Orientation = PAGE
    df = fields.getByIndex(COLS.index(data))
    df.Orientation = DATA
    df.Function = GF(func)
    idx = list(sheets.ElementNames).index(sheet_name)
    tables.insertNewByName(name, CellAddress(idx, at[0], at[1]), desc)

    t = tables.getByName(name)
    tf = t.getDataPilotFields()
    def field(n):
        return tf.getByName(n)
    if page:
        f = field(page[0])
        items = f.getItems()
        for it in items.ElementNames:
            items.getByName(it).IsHidden = it != page[1]
    for fname, keep in (hide or {}).items():
        f = field(fname)
        items = f.getItems()
        for it in items.ElementNames:
            items.getByName(it).IsHidden = it not in keep
    for fname in no_subtotals:
        field(fname).Subtotals = (GF("NONE"),)
    if tabular:
        for fname in rows:
            li = DataPilotFieldLayoutInfo(); li.LayoutMode = TABULAR; li.AddEmptyLines = False
            field(fname).LayoutInfo = li
    if collapse:
        items = field(collapse).getItems()
        for it in items.ElementNames:
            items.getByName(it).ShowDetail = False
    if sort_desc:
        si = DataPilotFieldSortInfo(); si.Field = sort_desc[1]; si.IsAscending = True; si.Mode = SORT_DATA
        field(sort_desc[0]).SortInfo = si
    if expect:   # LibreOffice applies filters/collapse intermittently: re-apply until the labels are right
        for _ in range(8):
            r = t.getOutputRange()
            labels = [sheet.getCellByPosition(0, x).getString() for x in range(r.StartRow, r.EndRow + 1)]
            labels = [v for v in labels if v and v not in ("Filter", page[0] if page else "", rows[0])]
            if labels == list(expect) + ["Total Result"]:
                break
            tf2 = t.getDataPilotFields()
            if page:
                items = tf2.getByName(page[0]).getItems()
                for it in items.ElementNames:
                    items.getByName(it).IsHidden = it != page[1]
            if collapse:
                items = tf2.getByName(collapse).getItems()
                for it in items.ElementNames:
                    items.getByName(it).ShowDetail = False
        else:
            raise SystemExit(f"{name}: output labels wrong: {labels[:6]}")
    r = t.getOutputRange()
    nf = doc.NumberFormats
    key = nf.queryKey(fmt, doc.CharLocale, False)
    if key == -1:
        key = nf.addNew(fmt, doc.CharLocale)
    sheet.getCellRangeByPosition(1, r.StartRow, r.EndColumn, r.EndRow).NumberFormat = key
    flags = 1 | 2 | 4 | 16 | 32 | 64   # values, text, formulas, borders/formatting
    sheet.getCellRangeByPosition(0, r.EndRow + 1, 20, r.EndRow + 1200).clearContents(flags)
    sheet.getCellRangeByPosition(r.EndColumn + 1, r.StartRow, r.EndColumn + 2, r.EndRow).clearContents(flags)
    return t


def main():
    src, out = map(os.path.abspath, sys.argv[1:3])
    desktop = connect()
    doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (prop("Hidden", True),))
    try:
        build(doc, out)
    finally:
        doc.close(True)


def build(doc, out):
    import json
    A = json.load(open("work/answers.json"))
    O, D = "Data_Original", "Data"
    pivot(doc, "Q1", "PT_Q1", O, 2340, rows=["Store"], data="Actual Price")
    pivot(doc, "Q2", "PT_Q2", O, 2340, rows=["Item"], data="Item", func="COUNT", fmt="#,##0")
    pivot(doc, "Q3", "PT_Q3", O, 2340, rows=["Item"], cols=["Region"], data="Actual Price")
    pivot(doc, "Q4", "PT_Q4", O, 2340, rows=["Item"], cols=["Region"], data="Actual Price",
          hide={"Item": {"Microwave", "Oven", "Refrigerator"}, "Region": {"APAC", "EMEA", "LATAM"}})
    pivot(doc, "Q5", "PT_Q5", O, 2340, rows=["Salesperson"], page=("Country", "Columbia"),
          data="Discount %", func="AVERAGE", at=(0, 3), sort_desc=("Salesperson", "Discount %"), fmt="0.00%",
          expect=list(A["Q5"]))
    region_layout = dict(rows=["Region", "Country", "Store"], data="Actual Price", tabular=True,
                         no_subtotals=("Country", "Store"))
    pivot(doc, "Q6", "PT_Q6", O, 2340, **region_layout)
    pivot(doc, "Q7", "PT_Q7", O, 2340, collapse="Region", expect=sorted(A["Q7"]), **region_layout)
    pivot(doc, "Q8", "PT_Q8", D, 2340, collapse="Region", expect=sorted(A["Q8"], key=str.lower), **region_layout)
    pivot(doc, "Q9", "PT_Q9", D, 2352, collapse="Region", expect=sorted(A["Q9"], key=str.lower), **region_layout)
    pivot(doc, "Q10", "PT_Q10", D, 2352, rows=["Store"], page=("Country", "USA"), data="Actual Price", at=(0, 3),
          expect=sorted(A["Q10"]))

    sheet = doc.Sheets.getByName("Q10")
    r = sheet.getDataPilotTables().getByName("PT_Q10").getOutputRange()
    first, last = r.EndRow - 8, r.EndRow - 1          # 8 store rows above "Total Result"
    assert sheet.getCellByPosition(0, first - 1).getString() == "Store", "unexpected Q10 layout"
    rng = sheet.getCellRangeByPosition(0, first - 1, 1, last).getRangeAddress()
    rect = Rectangle(); rect.X, rect.Y, rect.Width, rect.Height = 1000, sheet.getCellByPosition(0, last + 3).Position.Y, 15000, 9500
    sheet.getCharts().addNewByName("Q10_Pie", rect, (rng,), True, True)
    chart = sheet.getCharts().getByName("Q10_Pie").getEmbeddedObject()
    chart.setDiagram(chart.createInstance("com.sun.star.chart.PieDiagram"))
    chart.HasMainTitle = True
    chart.getTitle().String = "Sales ($) per store in the USA"
    chart.HasLegend = True
    chart.getDiagram().DataCaption = 5   # VALUE | PERCENT labels
    doc.calculateAll()
    doc.storeToURL(uno.systemPathToFileUrl(out), (prop("FilterName", "Calc MS Excel 2007 XML"),))
    print("saved", out)


if __name__ == "__main__":
    main()
