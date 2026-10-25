#!/usr/bin/env python3
"""Turn the final Markdown assignment (Parts A and C only) into an editable DOCX.

Usage: python3 -I build_docx.py <assignment.md> <out.docx> [--font "Times New Roman"] [--size 12] [--spacing 1.5]

pandoc does the conversion (headings, lists, tables, bold/italic); this
script then sets the body font, line spacing and margins, and gives every
paragraph under a "References" heading a 0.5-inch hanging indent.
Check the result by converting it to PDF and looking at the pages.
"""
import argparse
import subprocess

from docx import Document
from docx.shared import Inches, Pt, RGBColor


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--font", default="Times New Roman")
    ap.add_argument("--size", type=float, default=12)
    ap.add_argument("--spacing", type=float, default=1.5)
    a = ap.parse_args()

    subprocess.run(["pandoc", a.src, "-f", "markdown", "-t", "docx", "-o", a.out], check=True)
    doc = Document(a.out)

    for name in ("Normal", "Body Text", "First Paragraph", "Compact"):
        try:
            st = doc.styles[name]
        except KeyError:
            continue
        st.font.name = a.font
        st.font.size = Pt(a.size)
        st.paragraph_format.line_spacing = a.spacing
        st.paragraph_format.space_after = Pt(6)
    for st in doc.styles:
        if st.name.startswith(("Heading", "Title")):
            st.font.name = a.font
            st.font.color.rgb = RGBColor(0, 0, 0)
    for sec in doc.sections:
        sec.left_margin = sec.right_margin = Inches(1)
        sec.top_margin = sec.bottom_margin = Inches(1)

    in_refs = False
    for p in doc.paragraphs:
        if p.style.name.startswith("Heading"):
            in_refs = p.text.strip().lower() in ("references", "reference list", "bibliography", "works cited")
            continue
        if in_refs and p.text.strip():
            p.paragraph_format.left_indent = Inches(0.5)
            p.paragraph_format.first_line_indent = Inches(-0.5)
    doc.save(a.out)
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
