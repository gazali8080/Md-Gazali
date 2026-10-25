import os, sys, uno
sys.path.insert(0, "work/scripts")
from make_pivots import connect, prop
src, out = map(os.path.abspath, sys.argv[1:3])
doc = connect().loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (prop("Hidden", True),))
for name in ("Data_Original", "Data"):          # skip the 2,000-row data sheets in the preview
    doc.Sheets.getByName(name).IsVisible = False
doc.storeToURL(uno.systemPathToFileUrl(out), (prop("FilterName", "calc_pdf_Export"),))
doc.close(True)
