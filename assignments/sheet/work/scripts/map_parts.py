"""Map each worksheet to its pivot tables, drawings, charts, slicers, tables."""
import sys, zipfile, re, posixpath
z = zipfile.ZipFile(sys.argv[1])
def rels(path):
    d, b = posixpath.split(path)
    rp = posixpath.join(d, "_rels", b + ".rels")
    if rp not in z.namelist(): return []
    x = z.read(rp).decode()
    out = []
    for m in re.finditer(r'<Relationship [^>]*?Target="([^"]+)"[^>]*?/?>', x):
        t = m.group(1)
        if t.startswith("/"): t = t[1:]
        else: t = posixpath.normpath(posixpath.join(d, t))
        out.append(t)
    return out
wb = z.read("xl/workbook.xml").decode()
wbrels = {m.group(1): m.group(2) for m in re.finditer(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read("xl/_rels/workbook.xml.rels").decode())}
wbrels.update({m.group(2): m.group(1) for m in re.finditer(r'Target="([^"]+)"[^>]*Id="([^"]+)"', z.read("xl/_rels/workbook.xml.rels").decode())})
for m in re.finditer(r'<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]+)"', wb):
    name, rid = m.groups()
    t = wbrels.get(rid, "?"); t = t.lstrip("/"); t = t if t.startswith("xl/") else "xl/" + t
    parts = []
    for r in rels(t):
        parts.append(r)
        if "drawing" in r:
            for r2 in rels(r):
                parts.append("  " + r2)
    print(repr(name), t, "|", ", ".join(p.replace("xl/","") for p in parts))
