#!/usr/bin/env python3
"""Check that cited DOIs and URLs are real before they go into an assignment.

Usage: python3 -I check_refs.py <refs.txt>

refs.txt holds one reference per line (blank lines ignored). For each line:
  - every DOI is looked up on Crossref (no key needed) and its title, first
    author, year and venue are printed so they can be compared with the entry;
  - every other URL is requested and its HTTP status reported.

This proves a source exists and the metadata matches. It does NOT prove the
source supports the claim it is cited for: open the source and read it.
"""
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

DOI_RE = re.compile(r"10\.\d{4,9}/[^\s\"<>]+")
URL_RE = re.compile(r"https?://[^\s\"<>]+")
UA = {"User-Agent": "assignment-toolkit/1.0 (reference checker)"}


def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()


def check_doi(doi):
    doi = doi.rstrip(".,;)")
    try:
        _, body = get("https://api.crossref.org/works/" + urllib.parse.quote(doi))
    except urllib.error.HTTPError as e:
        return f"DOI {doi}: NOT FOUND on Crossref (HTTP {e.code}); try https://doi.org/{doi} manually"
    except Exception as e:  # network problems should not hide other results
        return f"DOI {doi}: lookup failed ({e})"
    m = json.loads(body)["message"]
    title = (m.get("title") or ["?"])[0]
    venue = (m.get("container-title") or [""])[0]
    authors = m.get("author") or []
    first = authors[0].get("family", "?") if authors else "?"
    year = "?"
    for key in ("published-print", "published-online", "issued"):
        parts = (m.get(key) or {}).get("date-parts")
        if parts and parts[0] and parts[0][0]:
            year = parts[0][0]
            break
    return f"DOI {doi}: OK | {first} ({year}) | {title} | {venue}"


def check_url(url):
    url = url.rstrip(".,;)")
    try:
        status, _ = get(url)
        return f"URL {url}: HTTP {status}"
    except urllib.error.HTTPError as e:
        note = " (site may block scripts; open with WebFetch)" if e.code in (401, 403, 405, 429) else ""
        return f"URL {url}: HTTP {e.code}{note}"
    except Exception as e:
        return f"URL {url}: FAILED ({e})"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]
    for n, line in enumerate(lines, 1):
        print(f"[{n}] {line[:90]}")
        dois = DOI_RE.findall(line)
        for doi in dois:
            print("    " + check_doi(doi))
        for url in URL_RE.findall(line):
            if "doi.org/" in url and dois:
                continue
            print("    " + check_url(url))
        if not dois and not URL_RE.search(line):
            print("    no DOI or URL: verify the book/report by search (publisher or library catalogue)")


if __name__ == "__main__":
    main()
