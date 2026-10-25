"""Add what LibreOffice cannot write: real PivotCharts (Q10, Q11) and an Item slicer on Q11.

The XML follows the structure Excel itself wrote in the supplied answer workbook
(input/B_answers.xlsx: xl/charts/chart3.xml is an Excel pie PivotChart, and
xl/slicers/slicer1.xml + xl/slicerCaches/ are an Excel slicer).

Usage: python3 -I excel_extras.py <in.xlsx> <out.xlsx> <answers.json>
"""
import json
import posixpath
import re
import shutil
import sys
import zipfile
from xml.sax.saxutils import escape

BOOK = "Pivot_Table_Assignment_Solution.xlsx"
TITLE = "Sales ($) per store in the USA"
SLICER_FIELD = "Item"
SLICER_SHEET, SLICER_PIVOT = "Q11", "PT_Q11"
CHART_SHEETS = {"Q10": "PT_Q10", "Q11": "PT_Q11"}
SLICER_CACHE_ID = 1   # x14 pivotCacheId shared by the cache definition and the slicer cache

NS_X14 = "http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"
REL_SLICER = "http://schemas.microsoft.com/office/2007/relationships/slicer"
REL_SLICER_CACHE = "http://schemas.microsoft.com/office/2007/relationships/slicerCache"


class Pkg:
    def __init__(self, path):
        z = zipfile.ZipFile(path)
        self.infos = {i.filename: i for i in z.infolist()}
        self.parts = {n: z.read(n) for n in z.namelist()}

    def get(self, name):
        return self.parts[name].decode("utf-8")

    def put(self, name, text):
        self.parts[name] = text.encode("utf-8")

    def save(self, path):
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            order = ["[Content_Types].xml"] + [n for n in self.parts if n != "[Content_Types].xml"]
            for n in order:
                info = self.infos.get(n) or zipfile.ZipInfo(n, date_time=(2026, 10, 25, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, self.parts[n])

    def rels_name(self, part):
        d, b = posixpath.split(part)
        return posixpath.join(d, "_rels", b + ".rels")

    def rels(self, part):
        """{rId: (type, absolute target)}"""
        name = self.rels_name(part)
        if name not in self.parts:
            return {}
        out = {}
        for m in re.finditer(r"<Relationship\b([^>]*)/?>", self.get(name)):
            a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
            tgt = a["Target"].lstrip("/") if a["Target"].startswith("/") else posixpath.normpath(
                posixpath.join(posixpath.dirname(part), a["Target"]))
            out[a["Id"]] = (a["Type"], tgt)
        return out

    def add_rel(self, part, rtype, target_rel):
        name = self.rels_name(part)
        if name not in self.parts:
            self.put(name, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                     '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')
        x = self.get(name)
        used = {int(i) for i in re.findall(r'Id="rId(\d+)"', x)}
        rid = f"rId{max(used | {0}) + 1}"
        x = x.replace("</Relationships>", f'<Relationship Id="{rid}" Type="{rtype}" Target="{target_rel}"/></Relationships>')
        self.put(name, x)
        return rid

    def add_override(self, part, ctype):
        x = self.get("[Content_Types].xml")
        if f'PartName="/{part}"' not in x:
            x = x.replace("</Types>", f'<Override PartName="/{part}" ContentType="{ctype}"/></Types>')
            self.put("[Content_Types].xml", x)


def sheet_map(pkg):
    wb = pkg.get("xl/workbook.xml")
    rels = pkg.rels("xl/workbook.xml")
    out = {}
    for m in re.finditer(r"<sheet\b([^>]*)/>", wb):
        a = dict(re.findall(r'([\w:]+)="([^"]*)"', m.group(1)))
        out[a["name"]] = {"part": rels[a["r:id"]][1], "sheetId": a["sheetId"]}
    return out


def find_rel(pkg, part, kind):
    return [t for (ty, t) in pkg.rels(part).values() if ty.endswith("/" + kind)]


def pivot_part(pkg, sheet_part, name):
    for p in find_rel(pkg, sheet_part, "pivotTable"):
        if f'name="{name}"' in pkg.get(p)[:600]:
            return p
    raise SystemExit(f"pivot {name} not found")


def str_cache(vals):
    pts = "".join(f'<c:pt idx="{i}"><c:v>{escape(str(v))}</c:v></c:pt>' for i, v in enumerate(vals))
    return f'<c:strCache><c:ptCount val="{len(vals)}"/>{pts}</c:strCache>'


def num_cache(vals):
    pts = "".join(f'<c:pt idx="{i}"><c:v>{v:g}</c:v></c:pt>' for i, v in enumerate(vals))
    return f'<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="{len(vals)}"/>{pts}</c:numCache>'


def pivot_chart_xml(sheet, pt, tx_ref, tx_val, cat_ref, cats, val_ref, vals):
    """Pie PivotChart in the same element order Excel uses (see B_answers.xlsx chart3.xml)."""
    text = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="{sz}"/></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>'
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<c:date1904 val="0"/><c:lang val="en-US"/><c:roundedCorners val="0"/>'
        f'<c:pivotSource><c:name>[{BOOK}]{sheet}!{pt}</c:name><c:fmtId val="0"/></c:pivotSource>'
        '<c:chart>'
        '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="0"/></a:pPr>'
        f'<a:r><a:rPr lang="en-US" sz="1400" b="0"/><a:t>{escape(TITLE)}</a:t></a:r></a:p></c:rich></c:tx>'
        '<c:overlay val="0"/></c:title>'
        '<c:autoTitleDeleted val="0"/>'
        '<c:pivotFmts><c:pivotFmt><c:idx val="0"/><c:marker><c:symbol val="none"/></c:marker></c:pivotFmt></c:pivotFmts>'
        '<c:plotArea><c:layout/><c:pieChart><c:varyColors val="1"/>'
        '<c:ser><c:idx val="0"/><c:order val="0"/>'
        f'<c:tx><c:strRef><c:f>{tx_ref}</c:f>{str_cache([tx_val])}</c:strRef></c:tx>'
        '<c:dLbls><c:numFmt formatCode="0.0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
        + text.format(sz=900) +
        '<c:dLblPos val="bestFit"/><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="1"/>'
        '<c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/><c:showLeaderLines val="1"/></c:dLbls>'
        f'<c:cat><c:strRef><c:f>{cat_ref}</c:f>{str_cache(cats)}</c:strRef></c:cat>'
        f'<c:val><c:numRef><c:f>{val_ref}</c:f>{num_cache(vals)}</c:numRef></c:val>'
        '</c:ser><c:firstSliceAng val="0"/></c:pieChart></c:plotArea>'
        '<c:legend><c:legendPos val="r"/><c:overlay val="0"/>' + text.format(sz=900) + '</c:legend>'
        '<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>'
        '<c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/>'
        '<c:pageSetup/></c:printSettings>'
        '<c:extLst><c:ext uri="{781A3756-C4B2-4CAC-9D66-4F8BD8637D16}" '
        'xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart"><c14:pivotOptions>'
        '<c14:dropZoneFilter val="1"/><c14:dropZoneCategories val="1"/><c14:dropZoneData val="1"/>'
        '<c14:dropZoneSeries val="1"/><c14:dropZonesVisible val="1"/></c14:pivotOptions></c:ext></c:extLst>'
        '</c:chartSpace>')


CHART_FORMATS = ('<chartFormats count="1"><chartFormat chart="0" format="0" series="1">'
                 '<pivotArea type="data" outline="0" fieldPosition="0"><references count="1">'
                 '<reference field="4294967294" count="1" selected="0"><x v="0"/></reference>'
                 '</references></pivotArea></chartFormat></chartFormats>')


def add_chart_formats(x):
    """chartFormats sits after dataFields/formats/conditionalFormats and before pivotTableStyleInfo."""
    if "<chartFormats" in x:
        return x
    x = x.replace("<pivotTableDefinition ", '<pivotTableDefinition chartFormat="1" ', 1)
    for anchor in ("<pivotHierarchies", "<pivotTableStyleInfo", "<filters", "<extLst", "</pivotTableDefinition>"):
        if anchor in x:
            return x.replace(anchor, CHART_FORMATS + anchor, 1)
    raise SystemExit("no anchor for chartFormats")


def make_pivot_charts(pkg, sheets, answers):
    for sheet, pt in CHART_SHEETS.items():
        sp = sheets[sheet]["part"]
        drawing = find_rel(pkg, sp, "drawing")[0]
        chart = find_rel(pkg, drawing, "chart")[0]
        old = pkg.get(chart)
        refs = re.findall(r"<c:f>([^<]*)</c:f>", old)
        assert len(refs) == 3, (chart, refs)
        stores = sorted(answers["Q10"])
        vals = [answers["Q10"][s] for s in stores]
        pkg.put(chart, pivot_chart_xml(sheet, pt, refs[0], "Total", refs[1], stores, refs[2], vals))
        # give the chart frame a real id/name instead of LibreOffice's id="0" name=""
        d = pkg.get(drawing)
        d = d.replace('<xdr:cNvPr id="0" name=""></xdr:cNvPr>', f'<xdr:cNvPr id="2" name="{sheet} PivotChart"/>', 1)
        pkg.put(drawing, d)
        pp = pivot_part(pkg, sp, pt)
        pkg.put(pp, add_chart_formats(pkg.get(pp)))
        print(f"{sheet}: {chart} -> PivotChart on {pt} ({len(stores)} slices, {refs})")


def slicer_anchor(name, col_from, row_from, col_to, row_to):
    return (
        '<xdr:twoCellAnchor editAs="oneCell">'
        f'<xdr:from><xdr:col>{col_from}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{row_from}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
        f'<xdr:to><xdr:col>{col_to}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{row_to}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>'
        '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><mc:Choice Requires="a14">'
        f'<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="3" name="{name}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>'
        '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic>'
        '<a:graphicData uri="http://schemas.microsoft.com/office/drawing/2010/slicer">'
        f'<sle:slicer xmlns:sle="http://schemas.microsoft.com/office/drawing/2010/slicer" name="{name}"/>'
        '</a:graphicData></a:graphic></xdr:graphicFrame></mc:Choice>'
        '<mc:Fallback xmlns=""><xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="0" name=""/>'
        '<xdr:cNvSpPr><a:spLocks noTextEdit="1"/></xdr:cNvSpPr></xdr:nvSpPr><xdr:spPr>'
        '<a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="2520000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        '<a:solidFill><a:prstClr val="white"/></a:solidFill><a:ln w="1"><a:solidFill><a:prstClr val="green"/></a:solidFill></a:ln>'
        '</xdr:spPr><xdr:txBody><a:bodyPr vertOverflow="clip" horzOverflow="clip"/><a:lstStyle/><a:p><a:r>'
        '<a:rPr lang="en-US" sz="1100"/><a:t>This shape represents a slicer. Slicers are supported in Excel 2010 or later.</a:t>'
        '</a:r></a:p></xdr:txBody></xdr:sp></mc:Fallback></mc:AlternateContent><xdr:clientData/></xdr:twoCellAnchor>')


def add_slicer(pkg, sheets):
    sp = sheets[SLICER_SHEET]["part"]
    tab_id = sheets[SLICER_SHEET]["sheetId"]
    pp = pivot_part(pkg, sp, SLICER_PIVOT)
    pt = pkg.get(pp)
    cache_id = re.search(r'cacheId="(\d+)"', pt).group(1)

    # cache definition used by the pivot: field index + item list, and the x14 id the slicer points at
    wb = pkg.get("xl/workbook.xml")
    cache_rid = re.search(rf'<pivotCache cacheId="{cache_id}" r:id="([^"]+)"', wb).group(1)
    cache_part = pkg.rels("xl/workbook.xml")[cache_rid][1]
    cd = pkg.get(cache_part)
    fields = re.findall(r'<cacheField name="([^"]*)"[^>]*>(.*?)</cacheField>', cd, re.S)
    fld = [f for f, _ in fields].index(SLICER_FIELD)
    items = re.findall(r'<s v="([^"]*)"', fields[fld][1])
    assert items, "slicer field has no shared items"
    if "x14:pivotCacheDefinition" not in cd:
        ext = (f'<extLst><ext uri="{{725AE2AE-9491-48be-B2B4-4EB974FC3084}}" xmlns:x14="{NS_X14}">'
               f'<x14:pivotCacheDefinition pivotCacheId="{SLICER_CACHE_ID}"/></ext></extLst>')
        assert "<extLst>" not in cd
        cd = cd.replace("</pivotCacheDefinition>", ext + "</pivotCacheDefinition>")
        pkg.put(cache_part, cd)

    # the pivot table must list the field's items so the slicer can hide them
    pfs = list(re.finditer(r'<pivotField\b[^>]*?(?:/>|>.*?</pivotField>)', pt, re.S))
    old_pf = pfs[fld].group(0)
    if "<items" not in old_pf:
        attrs = re.match(r"<pivotField\b([^>]*?)/?>", old_pf).group(1)
        its = "".join(f'<item x="{i}"/>' for i in range(len(items)))
        new_pf = f'<pivotField{attrs}><items count="{len(items) + 1}">{its}<item t="default"/></items></pivotField>'
        pt = pt.replace(old_pf, new_pf, 1)
        pkg.put(pp, pt)

    # slicer cache + slicer parts
    order = sorted(range(len(items)), key=lambda i: items[i].lower())
    cache_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<slicerCacheDefinition xmlns="{NS_X14}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'mc:Ignorable="x" xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        f'name="Slicer_{SLICER_FIELD}" sourceName="{SLICER_FIELD}">'
        f'<pivotTables><pivotTable tabId="{tab_id}" name="{SLICER_PIVOT}"/></pivotTables>'
        f'<data><tabular pivotCacheId="{SLICER_CACHE_ID}"><items count="{len(items)}">'
        + "".join(f'<i x="{i}" s="1"/>' for i in order) +
        '</items></tabular></data></slicerCacheDefinition>')
    slicer_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<slicers xmlns="{NS_X14}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'mc:Ignorable="x" xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<slicer name="{SLICER_FIELD}" cache="Slicer_{SLICER_FIELD}" caption="{SLICER_FIELD}" rowHeight="241300"/></slicers>')
    pkg.put("xl/slicerCaches/slicerCache1.xml", cache_xml)
    pkg.put("xl/slicers/slicer1.xml", slicer_xml)
    pkg.add_override("xl/slicerCaches/slicerCache1.xml", "application/vnd.ms-excel.slicerCache+xml")
    pkg.add_override("xl/slicers/slicer1.xml", "application/vnd.ms-excel.slicer+xml")

    # workbook: defined name, slicer cache relationship and extension list
    rid = pkg.add_rel("xl/workbook.xml", REL_SLICER_CACHE, "slicerCaches/slicerCache1.xml")
    wb = pkg.get("xl/workbook.xml")
    dn = f'<definedName name="Slicer_{SLICER_FIELD}">#N/A</definedName>'
    if "<definedNames>" in wb:
        wb = wb.replace("<definedNames>", "<definedNames>" + dn, 1)
    else:
        wb = wb.replace("<calcPr", f"<definedNames>{dn}</definedNames><calcPr", 1)
    ext = (f'<ext uri="{{BBE1A952-AA13-448e-AADC-164F8A28A991}}" xmlns:x14="{NS_X14}">'
           f'<x14:slicerCaches><x14:slicerCache r:id="{rid}"/></x14:slicerCaches></ext>')
    wb = wb.replace("<extLst>", "<extLst>" + ext, 1) if "<extLst>" in wb else wb.replace("</workbook>", f"<extLst>{ext}</extLst></workbook>")
    pkg.put("xl/workbook.xml", wb)

    # worksheet: slicer relationship + slicerList extension (extLst is the last child)
    srid = pkg.add_rel(sp, REL_SLICER, "../slicers/slicer1.xml")
    sx = pkg.get(sp)
    ext = (f'<ext uri="{{A8765BA9-456A-4dab-B4F3-ACF838C121DE}}" xmlns:x14="{NS_X14}">'
           f'<x14:slicerList><x14:slicer r:id="{srid}"/></x14:slicerList></ext>')
    sx = sx.replace("<extLst>", "<extLst>" + ext, 1) if "<extLst>" in sx else sx.replace("</worksheet>", f"<extLst>{ext}</extLst></worksheet>")
    pkg.put(sp, sx)

    # slicer shape on the sheet's drawing, to the right of the pivot (columns D-F)
    drawing = find_rel(pkg, sp, "drawing")[0]
    d = pkg.get(drawing)
    d = d.replace("</xdr:wsDr>", slicer_anchor(SLICER_FIELD, 3, 3, 6, 16) + "</xdr:wsDr>")
    pkg.put(drawing, d)
    print(f"slicer: field {SLICER_FIELD} (#{fld}, {len(items)} items) -> {SLICER_PIVOT} on {SLICER_SHEET} (tabId {tab_id}, cache {cache_part})")


def main():
    src, out, answers = sys.argv[1:4]
    pkg = Pkg(src)
    sheets = sheet_map(pkg)
    make_pivot_charts(pkg, sheets, json.load(open(answers)))
    add_slicer(pkg, sheets)
    pkg.save(out + ".tmp")
    shutil.move(out + ".tmp", out)


if __name__ == "__main__":
    main()
