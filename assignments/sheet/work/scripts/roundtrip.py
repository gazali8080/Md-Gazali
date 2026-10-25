import os, sys, uno
sys.path.insert(0, "work/scripts")
from make_pivots import connect, prop
src, out = map(os.path.abspath, sys.argv[1:3])
desktop = connect()
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (prop("Hidden", True),))
n = 0
for name in doc.Sheets.ElementNames:
    tabs = doc.Sheets.getByName(name).getDataPilotTables()
    for t in tabs.ElementNames:
        tabs.getByName(t).refresh(); n += 1
print("refreshed pivots:", n, "charts on Q10:", doc.Sheets.getByName("Q10").getCharts().ElementNames)
doc.storeToURL(uno.systemPathToFileUrl(out), (prop("FilterName", "Calc MS Excel 2007 XML"),))
pdf = out.replace(".xlsx", ".pdf")
doc.close(True)
