#!/usr/bin/env python3
"""Bootstrap papers/inbox folders from data/publications.json.

This script creates a paper.yml for every publication entry and downloads PDFs
for papers with known open-access sources. The resulting inbox folders can then
be processed by scripts/ingest_papers.py to generate figures, BibTeX files, and
updated publication data for the website.
"""

from __future__ import annotations

import argparse
import json
import ssl
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "publications.json"
INBOX = ROOT / "papers" / "inbox"

# Known open-access copies discovered from public sources.
PDF_OVERRIDES = {
    "task-breakpoint": "https://arxiv.org/pdf/2603.07627",
    "meta-objects": "https://arxiv.org/pdf/2404.17179",
    "subspace-allocation": "https://arxiv.org/pdf/2408.04297",
    "translation-gain": "https://arxiv.org/pdf/2206.05522",
}


def fetch_text(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/plain, text/html, application/x-bibtex, */*",
        },
    )
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
        return response.read().decode("utf-8", "replace")


def fetch_binary(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/pdf,application/octet-stream,*/*",
        },
    )
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
        return response.read()


def yaml_quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def authors_block(authors: list[str]) -> str:
    if not authors:
        return "authors: []"
    lines = ["authors:"]
    for author in authors:
        lines.append(f"  - {yaml_quote(author)}")
    return "\n".join(lines)


def bibtex_block(value: str) -> str:
    if not value.strip():
        return "bibtex: |\n  "
    lines = ["bibtex: |"]
    for line in value.rstrip().splitlines():
        lines.append(f"  {line}")
    return "\n".join(lines)


def resolve_bibtex(publication: dict) -> str:
    bibtex = str(publication.get("bibtex", "") or "").strip()
    if not bibtex:
        return ""
    if bibtex.startswith("http://") or bibtex.startswith("https://"):
        try:
            return fetch_text(bibtex)
        except urllib.error.URLError:
            return ""
    return bibtex


def write_paper_yml(folder: Path, publication: dict, bibtex: str) -> None:
    content = "\n".join(
        [
            f"id: {yaml_quote(publication['id'])}",
            f"title: {yaml_quote(publication['title'])}",
            authors_block(publication.get("authors") or []),
            f"year: {int(publication['year'])}",
            f"venue: {yaml_quote(publication.get('venue', ''))}",
            f"abstract: {yaml_quote(publication.get('abstract', ''))}",
            'doi: ""',
            f"record: {yaml_quote(publication.get('record', ''))}",
            "",
            'main_figure: ""',
            'figure_caption: ""',
            "",
            f"visual_type: {publication.get('visualType', 'spaces') or 'spaces'}",
            "",
            bibtex_block(bibtex),
            "bibtex_type: inproceedings",
            "",
        ]
    )
    (folder / "paper.yml").write_text(content, encoding="utf-8")


def maybe_download_pdf(folder: Path, publication: dict, overwrite: bool) -> tuple[bool, str]:
    destination = folder / "paper.pdf"
    if destination.exists() and not overwrite:
        return True, "kept existing PDF"

    source = PDF_OVERRIDES.get(publication["id"], "")
    if not source:
        source = str(publication.get("pdf", "") or "")
        parsed = urllib.parse.urlparse(source)
        if not (parsed.scheme in {"http", "https"} and "arxiv.org" in parsed.netloc and "/pdf/" in parsed.path):
            return False, "no open PDF source configured"

    try:
        payload = fetch_binary(source)
    except urllib.error.URLError as error:
        return False, f"download failed: {error.reason}"

    if not payload.startswith(b"%PDF"):
        return False, "response was not a PDF"

    destination.write_bytes(payload)
    return True, f"downloaded from {source}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download-pdfs", action="store_true", help="Download PDFs for publications with known open sources.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing paper.yml and paper.pdf files.")
    args = parser.parse_args()

    INBOX.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    publications = data.get("publications", [])

    for publication in publications:
        folder = INBOX / publication["id"]
        folder.mkdir(parents=True, exist_ok=True)

        yml_path = folder / "paper.yml"
        if args.overwrite or not yml_path.exists():
            bibtex = resolve_bibtex(publication)
            write_paper_yml(folder, publication, bibtex)
            print(f"YML   {publication['id']}")
        else:
            print(f"YML   {publication['id']} (kept existing)")

        if args.download_pdfs:
            ok, message = maybe_download_pdf(folder, publication, args.overwrite)
            prefix = "PDF" if ok else "SKIP"
            print(f"{prefix:<5} {publication['id']}: {message}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
