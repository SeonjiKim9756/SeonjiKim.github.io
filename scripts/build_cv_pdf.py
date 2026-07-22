#!/usr/bin/env python3
"""Build a PDF CV from the website data files."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PROFILE_FILE = ROOT / "data" / "profile.json"
PUBLICATION_FILE = ROOT / "data" / "publications.json"
OUTPUT_FILE = ROOT / "assets" / "cv" / "Seonji_Kim_CV.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 18 * mm
MARGIN_Y = 18 * mm
CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X

PALETTE = {
    "ink": colors.HexColor("#16212b"),
    "muted": colors.HexColor("#5f7184"),
    "line": colors.HexColor("#d8e5f0"),
    "accent": colors.HexColor("#5f86cf"),
    "soft": colors.HexColor("#ebf4fb"),
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    html = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("**", "<b>", 1)
        .replace("**", "</b>", 1)
    )
    while "**" in html:
        html = html.replace("**", "<b>", 1).replace("**", "</b>", 1)
    return Paragraph(html, style)


def build_styles() -> dict[str, ParagraphStyle]:
    styles = getSampleStyleSheet()
    return {
        "name": ParagraphStyle(
            "Name",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=28,
            textColor=PALETTE["ink"],
            spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "Meta",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=PALETTE["muted"],
        ),
        "stamp": ParagraphStyle(
            "Stamp",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            alignment=TA_RIGHT,
            textColor=PALETTE["ink"],
        ),
        "statement": ParagraphStyle(
            "Statement",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=12,
            leading=17,
            textColor=PALETTE["muted"],
            spaceAfter=12,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=PALETTE["muted"],
        ),
        "section": ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=PALETTE["ink"],
            spaceAfter=6,
        ),
        "label": ParagraphStyle(
            "Label",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=PALETTE["muted"],
            letterSpacing=0.8,
        ),
        "timeline_period": ParagraphStyle(
            "TimelinePeriod",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=PALETTE["muted"],
        ),
        "timeline_title": ParagraphStyle(
            "TimelineTitle",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=PALETTE["ink"],
        ),
        "timeline_body": ParagraphStyle(
            "TimelineBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=PALETTE["muted"],
        ),
        "year_group": ParagraphStyle(
            "YearGroup",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=PALETTE["muted"],
            spaceBefore=4,
            spaceAfter=6,
        ),
        "pub_title": ParagraphStyle(
            "PubTitle",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.8,
            leading=11,
            textColor=PALETTE["ink"],
            spaceAfter=1,
        ),
        "pub_meta": ParagraphStyle(
            "PubMeta",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7.8,
            leading=10,
            textColor=PALETTE["muted"],
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=PALETTE["muted"],
            alignment=TA_RIGHT,
        ),
    }


def section_heading(text: str, styles: dict[str, ParagraphStyle]) -> list:
    return [Spacer(1, 10), Paragraph(text, styles["section"]), HRFlowable(width="100%", thickness=0.6, color=PALETTE["line"]), Spacer(1, 8)]


def make_timeline(items: list[dict], styles: dict[str, ParagraphStyle], include_meta: bool = True) -> Table:
    rows = []
    for item in items:
        summary_bits = [f"<b>{item['title']}</b>", item["summary"]]
        if include_meta and item.get("meta"):
            summary_bits.append(item["meta"])
        body = "<br/>".join(summary_bits)
        rows.append([Paragraph(item["period"], styles["timeline_period"]), Paragraph(body, styles["timeline_body"])])
    table = Table(rows, colWidths=[34 * mm, CONTENT_WIDTH - 34 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def make_teaching(items: list[dict], styles: dict[str, ParagraphStyle]) -> Table:
    rows = []
    for item in items:
        body = f"<b>{item['title']}</b><br/>{item['summary']}"
        rows.append(
            [
                Paragraph(item["code"], styles["timeline_period"]),
                Paragraph(body, styles["timeline_body"]),
            ]
        )
    table = Table(rows, colWidths=[24 * mm, CONTENT_WIDTH - 24 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def make_publication_block(paper: dict, styles: dict[str, ParagraphStyle]) -> list:
    authors = ", ".join(
        f"<b>{author}</b>" if author == "Seonji Kim" else author
        for author in paper.get("authors", [])
    )
    venue = paper.get("venue", "")
    summary = f"{authors}<br/>{venue}"
    return [
        Paragraph(paper["title"], styles["pub_title"]),
        Paragraph(summary, styles["pub_meta"]),
        Spacer(1, 3),
    ]


def on_page(canvas, doc) -> None:
    canvas.saveState()
    canvas.setStrokeColor(PALETTE["line"])
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 12 * mm, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 12 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(PALETTE["muted"])
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf() -> None:
    styles = build_styles()
    profile = load_json(PROFILE_FILE)
    publications = load_json(PUBLICATION_FILE)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title="Seonji Kim CV",
        author="Seonji Kim",
    )

    updated_stamp = f"Latest update: {publications.get('lastUpdated', 'July 2026')}"
    story = []

    intro_left = [
        Paragraph(profile["name"], styles["name"]),
        Paragraph(" · ".join(profile.get("heroMeta", [])), styles["meta"]),
    ]
    intro_right = [Paragraph(updated_stamp, styles["stamp"])]

    intro_table = Table([[intro_left, intro_right]], colWidths=[CONTENT_WIDTH - 54 * mm, 54 * mm])
    intro_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.extend([intro_table, Spacer(1, 10), HRFlowable(width="100%", thickness=0.8, color=PALETTE["line"]), Spacer(1, 12)])

    story.extend(section_heading("About", styles))
    story.append(paragraph(profile.get("about", ""), styles["body"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("RESEARCH INTERESTS", styles["label"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(" · ".join(profile.get("interests", [])), styles["body"]))

    story.extend(section_heading("Publications", styles))
    current_year = None
    for paper in publications.get("publications", []):
        if paper["year"] != current_year:
            current_year = paper["year"]
            story.append(Paragraph(str(current_year), styles["year_group"]))
        story.extend(make_publication_block(paper, styles))

    story.extend(section_heading("Research Experience", styles))
    story.append(make_timeline(profile.get("research", []), styles, include_meta=True))

    story.extend(section_heading("Education", styles))
    story.append(make_timeline(profile.get("education", []), styles, include_meta=False))

    story.extend(section_heading("Teaching", styles))
    story.append(make_teaching(profile.get("teaching", []), styles))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)


if __name__ == "__main__":
    build_pdf()
