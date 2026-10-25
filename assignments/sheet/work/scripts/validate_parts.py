"""Validate the workbook's core XML parts against the ISO/IEC 29500 transitional schemas.

mc:AlternateContent is resolved to its Fallback (what a pre-2010 reader sees);
extLst content is left to the schema's lax wildcard. Slicer parts (Microsoft x14
namespace) have no schema here; they are only checked for well-formedness.
Usage: python3 -I validate_parts.py <file.xlsx>
"""
import re
import sys
import zipfile
from pathlib import Path

from lxml import etree

SCHEMAS = Path("/root/.claude/skills/synced/d6bc8576-7363-4e90-bfb0-95f1c0ac572b_2dddf385-a66d-43db-ab79-8ac3096ee2ec"
               "/xlsx/scripts/office/schemas/ISO-IEC29500-4_2016")
RULES = [
    (r"xl/workbook\.xml$", "sml.xsd"),
    (r"xl/worksheets/sheet\d+\.xml$", "sml.xsd"),
    (r"xl/pivotTables/pivotTable\d+\.xml$", "sml.xsd"),
    (r"xl/pivotCache/pivotCacheDefinition\d+\.xml$", "sml.xsd"),
    (r"xl/charts/chart\d+\.xml$", "dml-chart.xsd"),
    (r"xl/drawings/drawing\d+\.xml$", "dml-spreadsheetDrawing.xsd"),
]
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"


def resolve_mc(root):
    for ac in list(root.iter(f"{{{MC}}}AlternateContent")):
        fb = ac.find(f"{{{MC}}}Fallback")
        parent = ac.getparent()
        i = parent.index(ac)
        parent.remove(ac)
        for child in reversed(list(fb) if fb is not None else []):
            parent.insert(i, child)
    ignorable = set()
    for el in root.iter():
        if not isinstance(el.tag, str):
            continue
        prefixes = el.attrib.pop(f"{{{MC}}}Ignorable", "").split()
        ignorable |= {el.nsmap[p] for p in prefixes if p in el.nsmap}
    for el in list(root.iter()):
        if not isinstance(el.tag, str):
            continue
        for k in [k for k in el.attrib if k.startswith("{") and k[1:k.index("}")] in ignorable]:
            del el.attrib[k]
        if el.tag.startswith("{") and el.tag[1:el.tag.index("}")] in ignorable and el.getparent() is not None:
            el.getparent().remove(el)


def main():
    z = zipfile.ZipFile(sys.argv[1])
    cache, errors, checked = {}, 0, 0
    for name in z.namelist():
        if not name.endswith((".xml", ".rels")):
            continue
        root = etree.fromstring(z.read(name))      # well-formedness for every part
        xsd = next((x for pat, x in RULES if re.search(pat, name)), None)
        if not xsd:
            continue
        if xsd not in cache:
            cache[xsd] = etree.XMLSchema(etree.parse(str(SCHEMAS / xsd)))
        resolve_mc(root)
        checked += 1
        if not cache[xsd].validate(root):
            for e in list(cache[xsd].error_log)[:5]:
                errors += 1
                print(f"INVALID {name}: line {e.line}: {e.message[:220]}")
    print(f"schema-checked {checked} parts, {errors} errors; all {len(z.namelist())} parts well-formed")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
