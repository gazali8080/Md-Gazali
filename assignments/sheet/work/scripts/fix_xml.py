"""Write into the .xlsx the pivot settings LibreOffice does not export, in Excel's own encoding.

- single-item report filters  -> <pageField item="i"/> (no hidden flags)
- Q5 sort by value ascending   -> sortType="ascending" + autoSortScope on data field 0
- Q7-Q9 collapsed Region field -> sd="0" on every Region item
"""
import re, shutil, sys, zipfile

AUTOSORT = ('<autoSortScope><pivotArea dataOnly="0" outline="0" fieldPosition="0"><references count="1">'
            '<reference field="4294967294" count="1" selected="0"><x v="0"/></reference>'
            '</references></pivotArea></autoSortScope>')
FIELD = re.compile(r'<pivotField\b[^>]*?(?:/>|>.*?</pivotField>)', re.S)
SORT = {"PT_Q5": 5}                      # pivot name -> field index (Salesperson)
COLLAPSE = {"PT_Q7": 2, "PT_Q8": 2, "PT_Q9": 2}  # Region


def field(x, i):
    return list(FIELD.finditer(x))[i].group(0)


def fix(x):
    name = re.search(r'<pivotTableDefinition\b[^>]*\bname="([^"]+)"', x).group(1)
    for m in re.finditer(r'<pageField fld="(\d+)"([^/]*)/>', x):
        fld = int(m.group(1))
        pf = field(x, fld)
        items = re.findall(r'<item\b[^>]*/>', pf)
        shown = [i for i, it in enumerate(items) if 'h="1"' not in it and 't="' not in it]
        if len(shown) == 1 and "item=" not in m.group(0):
            x = x.replace(pf, pf.replace(' h="1"', ""), 1)
            x = x.replace(m.group(0), f'<pageField fld="{fld}" item="{shown[0]}"{m.group(2)}/>', 1)
            print(name, "filter field", fld, "-> item", shown[0])
    if name in SORT:
        pf = field(x, SORT[name])
        assert pf.endswith("</pivotField>"), pf[:80]
        new = pf.replace("<pivotField ", '<pivotField sortType="ascending" ', 1).replace("</pivotField>", AUTOSORT + "</pivotField>")
        x = x.replace(pf, new, 1)
        print(name, "sort by value ascending on field", SORT[name])
    if name in COLLAPSE:
        pf = field(x, COLLAPSE[name])
        new = re.sub(r'<item x="(\d+)"/>', r'<item x="\1" sd="0"/>', pf)
        x = x.replace(pf, new, 1)
        print(name, "collapsed field", COLLAPSE[name], new.count('sd="0"'), "items")
    return x


src, out = sys.argv[1:3]
zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(out + ".tmp", "w", zipfile.ZIP_DEFLATED)
for info in zin.infolist():
    data = zin.read(info.filename)
    if re.match(r"xl/pivotTables/pivotTable\d+\.xml$", info.filename):
        data = fix(data.decode()).encode()
    zout.writestr(info, data)
zout.close()
shutil.move(out + ".tmp", out)
