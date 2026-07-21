#!/usr/bin/env python3
"""Cache BibTeX text into data/publications.json for client-side display."""

from __future__ import annotations

import json
import ssl
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "publications.json"


def fetch_text(source: str) -> str:
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(
            source,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "text/plain, application/x-bibtex, */*",
            },
        )
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
            return response.read().decode("utf-8", "replace").strip()
    return (ROOT / source).read_text(encoding="utf-8").strip()


def main() -> int:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    for paper in data.get("publications", []):
        source = str(paper.get("bibtex", "") or "").strip()
        if not source:
            paper["bibtexText"] = ""
            continue
        try:
            paper["bibtexText"] = fetch_text(source)
        except Exception as error:  # noqa: BLE001
            print(f"SKIP  {paper['id']}: {error}")
            paper["bibtexText"] = paper.get("bibtexText", "")
        else:
            print(f"CACHE {paper['id']}")
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
