#!/usr/bin/env python3
"""Convert PDFs placed in papers/inbox into website-ready publication assets.

Values in paper.yml always override automatically extracted values. Automatic
extraction is deliberately treated as a draft because publisher PDF layouts vary.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
import yaml


ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "papers" / "inbox"
DATA_FILE = ROOT / "data" / "publications.json"
ASSET_ROOT = ROOT / "assets" / "papers"


def clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or f"paper-{datetime.now():%Y%m%d%H%M%S}"


def read_config(folder: Path) -> dict[str, Any]:
    path = folder / "paper.yml"
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def extract_abstract(text: str) -> str:
    patterns = [
        r"(?is)\babstract\s*[—:-]?\s*(.+?)(?=\n\s*(?:index terms|keywords|1\.?\s+introduction|i\.?\s+introduction)\b)",
        r"(?is)\babstract\s*[—:-]?\s*(.{120,2400}?)(?=\b(?:keywords|introduction)\b)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return clean(match.group(1))[:3500]
    return ""


def infer_title(metadata: dict[str, Any], first_page: str, fallback: str) -> str:
    meta_title = clean(metadata.get("title"))
    if len(meta_title) >= 12 and meta_title.lower() not in {"untitled", "unknown"}:
        return meta_title
    candidates = [clean(line) for line in first_page.splitlines()]
    candidates = [line for line in candidates if 20 <= len(line) <= 240]
    return max(candidates[:12], key=len, default=fallback)


def infer_year(config: dict[str, Any], metadata: dict[str, Any], text: str) -> int:
    if config.get("year"):
        return int(config["year"])
    date_blob = f"{metadata.get('creationDate', '')} {metadata.get('modDate', '')} {text[:1500]}"
    years = re.findall(r"\b(20\d{2})\b", date_blob)
    return int(years[0]) if years else datetime.now().year


def infer_authors(config: dict[str, Any], metadata: dict[str, Any]) -> list[str]:
    value = config.get("authors")
    if isinstance(value, list):
        return [clean(str(author)) for author in value if clean(str(author))]
    if isinstance(value, str) and clean(value):
        return [clean(author) for author in re.split(r"\s*;\s*", value) if clean(author)]
    meta_authors = clean(metadata.get("author"))
    if meta_authors:
        return [clean(author) for author in re.split(r"\s*;\s*", meta_authors) if clean(author)]
    return ["Update authors in paper.yml"]


def find_doi(config: dict[str, Any], text: str) -> str:
    if config.get("doi"):
        return clean(str(config["doi"])).removeprefix("https://doi.org/")
    match = re.search(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+", text, re.I)
    return match.group(0).rstrip(".,;)") if match else ""


def extract_largest_image(doc: fitz.Document, output: Path, max_pages: int = 6) -> Path | None:
    best: tuple[int, int] | None = None
    for page_index in range(min(max_pages, len(doc))):
        for image in doc[page_index].get_images(full=True):
            xref = image[0]
            width, height = image[2], image[3]
            if width < 320 or height < 180:
                continue
            ratio = width / max(height, 1)
            if ratio < 0.35 or ratio > 5.5:
                continue
            area = width * height
            if best is None or area > best[0]:
                best = (area, xref)
    if best is None:
        return None
    image = doc.extract_image(best[1])
    extension = image.get("ext", "png")
    destination = output.with_suffix(f".{extension}")
    destination.write_bytes(image["image"])
    return destination


def bibtex_text(config: dict[str, Any], paper: dict[str, Any], doi: str) -> str:
    if clean(str(config.get("bibtex", ""))):
        return str(config["bibtex"]).strip() + "\n"
    entry_type = clean(str(config.get("bibtex_type", "inproceedings"))) or "inproceedings"
    fields = [
        f"  title = {{{paper['title']}}}",
        f"  author = {{{' and '.join(paper['authors'])}}}",
        f"  booktitle = {{{paper['venue']}}}",
        f"  year = {{{paper['year']}}}",
    ]
    if doi:
        fields.append(f"  doi = {{{doi}}}")
    return f"@{entry_type}{{{paper['id']},\n" + ",\n".join(fields) + "\n}\n"


def process_folder(folder: Path) -> dict[str, Any] | None:
    pdfs = sorted(folder.glob("*.pdf"))
    if not pdfs:
        print(f"SKIP  {folder.name}: no PDF")
        return None
    config = read_config(folder)
    pdf_path = pdfs[0]
    doc = fitz.open(pdf_path)
    metadata = doc.metadata or {}
    pages_text = "\n".join(page.get_text("text") for page in doc[: min(4, len(doc))])
    first_page = doc[0].get_text("text") if len(doc) else ""

    title = clean(str(config.get("title", ""))) or infer_title(metadata, first_page, pdf_path.stem)
    paper_id = slugify(str(config.get("id") or folder.name or title))
    destination = ASSET_ROOT / paper_id
    destination.mkdir(parents=True, exist_ok=True)
    manual_figure = config.get("main_figure")
    figure_path: Path | None = None
    if manual_figure:
        source = folder / str(manual_figure)
        if source.exists():
            figure_path = destination / f"main-figure{source.suffix.lower()}"
            shutil.copy2(source, figure_path)
    if figure_path is None:
        figure_path = extract_largest_image(doc, destination / "main-figure")

    doi = find_doi(config, pages_text)
    record = clean(str(config.get("record", ""))) or (f"https://doi.org/{doi}" if doi else "")
    paper = {
        "id": paper_id,
        "year": infer_year(config, metadata, pages_text),
        "venue": clean(str(config.get("venue", ""))) or "Venue to be updated",
        "title": title,
        "authors": infer_authors(config, metadata),
        "abstract": clean(str(config.get("abstract", ""))) or extract_abstract(pages_text),
        "visualType": clean(str(config.get("visual_type", "spaces"))) or "spaces",
        "thumbnail": figure_path.relative_to(ROOT).as_posix() if figure_path else "",
        "mainFigure": figure_path.relative_to(ROOT).as_posix() if figure_path else "",
        "figureCaption": clean(str(config.get("figure_caption", ""))) or ("Automatically extracted figure candidate. Review before publishing." if figure_path else ""),
        "pdf": pdf_path.relative_to(ROOT).as_posix(),
        "bibtex": (destination / "citation.bib").relative_to(ROOT).as_posix(),
        "record": record,
    }
    (destination / "citation.bib").write_text(bibtex_text(config, paper, doi), encoding="utf-8")
    doc.close()
    print(f"ADD   {paper['year']} · {paper['title']}")
    return paper


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="Fail if essential metadata is still missing")
    args = parser.parse_args()

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    publications = data.get("publications", [])
    incoming: list[dict[str, Any]] = []
    for folder in sorted(INBOX.iterdir()):
        if folder.is_dir() and not folder.name.startswith("_"):
            paper = process_folder(folder)
            if paper:
                incoming.append(paper)

    for paper in incoming:
        publications = [existing for existing in publications if existing.get("id") != paper["id"]]
        publications.append(paper)

    publications.sort(key=lambda item: (-int(item.get("year", 0)), item.get("title", "").lower()))
    if args.strict:
        incomplete = [p["id"] for p in incoming if not p.get("abstract") or p.get("venue") == "Venue to be updated" or p.get("authors") == ["Update authors in paper.yml"]]
        if incomplete:
            raise SystemExit(f"Incomplete metadata: {', '.join(incomplete)}")

    data["lastUpdated"] = datetime.now().strftime("%B %Y")
    data["publications"] = publications
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"DONE  {len(incoming)} incoming paper(s), {len(publications)} total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
