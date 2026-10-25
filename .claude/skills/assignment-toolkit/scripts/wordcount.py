#!/usr/bin/env python3
"""Measure words per answer in a Markdown draft.

Usage: python3 -I wordcount.py <draft.md> [limits.json]

Answers are split on headings that start with "Question" or "Q" followed by
a number (e.g. "## Question 3: ..." or "### Q2(b)"). Citations in
parentheses are counted, matching how most markers count. limits.json is
optional: {"Question 1": 300, "Question 2": 500}; answers more than 10%
over or under a limit are flagged.
"""
import json
import re
import sys

HEAD = re.compile(r"^#{1,6}\s*((?:Question|Q)\s*\d+[^\n:]*)", re.I | re.M)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    text = open(sys.argv[1], encoding="utf-8").read()
    limits = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
    heads = list(HEAD.finditer(text))
    if not heads:
        sys.exit("no 'Question N' headings found")
    total = 0
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        line_end = text.find("\n", h.end())
        body = text[line_end if line_end != -1 else end:end]
        body = re.split(r"^#{1,6}\s*References\b", body, flags=re.I | re.M)[0]
        words = len(re.findall(r"[A-Za-z0-9][\w'’.-]*", body))
        total += words
        label = h.group(1).strip()
        key = next((k for k in limits if label.lower().startswith(k.lower())), None)
        flag = ""
        if key:
            lim = limits[key]
            if words > lim * 1.1:
                flag = f"  OVER limit {lim}"
            elif words < lim * 0.9:
                flag = f"  under limit {lim}"
        print(f"{label[:60]:<60} {words:>6}{flag}")
    print(f"{'TOTAL':<60} {total:>6}")


if __name__ == "__main__":
    main()
