from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import fitz
import pikepdf
import yaml
from PIL import Image
from pikepdf import Array, Dictionary, Name, String


ROOT = Path(__file__).resolve().parent
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}


@dataclass
class PageSpec:
    anchor: str
    asset: Path
    kind: str
    section: str | None = None
    section_title: str | None = None
    toc_hotspots: dict[str, list[float]] | None = None


def load_config() -> dict:
    with (ROOT / "journal.yaml").open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def expand_pages(config: dict) -> list[PageSpec]:
    pages = [
        PageSpec(
            anchor=item["id"],
            asset=ROOT / item["asset"],
            kind=item["type"],
            toc_hotspots=item.get("toc_hotspots"),
        )
        for item in config["pages"]
    ]
    for section in config["sections"]:
        section_id = section["id"]
        pages.append(
            PageSpec(
                anchor=section_id,
                asset=ROOT / section["divider"],
                kind="divider",
                section=section_id,
                section_title=section["title"],
            )
        )
        assets = section.get("pages")
        if assets is None:
            templates = section.get("templates")
            if templates is None:
                templates = [section["template"]]
            assets = [templates[index % len(templates)] for index in range(int(section["count"]))]
        for number, asset in enumerate(assets, start=1):
            pages.append(
                PageSpec(
                    anchor=f"{section_id}.{number:03d}",
                    asset=ROOT / asset,
                    kind="journal",
                    section=section_id,
                    section_title=section["title"],
                )
            )
    pages.extend(
        PageSpec(
            anchor=item["id"],
            asset=ROOT / item["asset"],
            kind=item["type"],
            toc_hotspots=item.get("toc_hotspots"),
        )
        for item in config.get("trailing_pages", [])
    )
    for move in config.get("move_pages", []):
        source_index = next(
            index for index, page in enumerate(pages) if page.anchor == move["id"]
        )
        page = pages.pop(source_index)
        target_index = int(move["position"]) - 1
        pages.insert(target_index, page)
    return pages


def source_size(asset: Path) -> tuple[float, float]:
    if asset.suffix.lower() == ".pdf":
        source = fitz.open(asset)
        if source.page_count != 1:
            raise ValueError(f"{asset} must contain exactly one page")
        rect = source[0].rect
        source.close()
        return rect.width, rect.height
    if asset.suffix.lower() in IMAGE_EXTENSIONS:
        with Image.open(asset) as image:
            dpi = image.info.get("dpi", (300, 300))
            return image.width * 72 / dpi[0], image.height * 72 / dpi[1]
    raise ValueError(f"Unsupported artwork format: {asset}")


def verify_assets(pages: list[PageSpec], tolerance: float) -> tuple[float, float]:
    missing = sorted({str(page.asset.relative_to(ROOT)) for page in pages if not page.asset.exists()})
    if missing:
        formatted = "\n".join(f"  - {item}" for item in missing)
        raise FileNotFoundError(f"Missing artwork:\n{formatted}")

    return source_size(pages[0].asset)


def add_artwork(document: fitz.Document, asset: Path, page_rect: fitz.Rect) -> None:
    page = document.new_page(width=page_rect.width, height=page_rect.height)
    page.draw_rect(page.rect, color=(0, 0, 0), fill=(0, 0, 0), overlay=False)
    if asset.suffix.lower() == ".pdf":
        source = fitz.open(asset)
        page.show_pdf_page(page.rect, source, 0, keep_proportion=True)
        source.close()
    else:
        page.insert_image(page.rect, filename=str(asset), keep_proportion=True)


def normalized_rect(page_rect: fitz.Rect, coords: list[float]) -> Array:
    left, top, right, bottom = coords
    height = page_rect.height
    return Array(
        [
            page_rect.width * left,
            height - (page_rect.height * bottom),
            page_rect.width * right,
            height - (page_rect.height * top),
        ]
    )


def link_annotation(rect: Array, destination: str) -> Dictionary:
    return Dictionary(
        Type=Name.Annot,
        Subtype=Name.Link,
        Rect=rect,
        Border=Array([0, 0, 0]),
        A=Dictionary(S=Name.GoTo, D=String(destination)),
    )


def add_named_navigation(
    input_pdf: Path, output_pdf: Path, config: dict, pages: list[PageSpec]
) -> None:
    hotspots = config["hotspots"]
    anchor_to_index = {page.anchor: index for index, page in enumerate(pages)}
    section_ids = [section["id"] for section in config["sections"]]

    with pikepdf.open(input_pdf) as pdf:
        names = Array()
        for anchor, index in sorted(anchor_to_index.items()):
            names.extend([String(anchor), Array([pdf.pages[index].obj, Name.Fit])])
        pdf.Root.Names = pdf.Root.get("/Names", Dictionary())
        pdf.Root.Names.Dests = Dictionary(Names=names)

        for index, spec in enumerate(pages):
            page = pdf.pages[index]
            media = [float(value) for value in page.MediaBox]
            rect = fitz.Rect(media)
            annotations = page.obj.get("/Annots", Array())

            def add(coords: list[float], destination: str) -> None:
                annotations.append(link_annotation(normalized_rect(rect, coords), destination))

            if spec.kind == "contents":
                for destination, coords in (spec.toc_hotspots or {}).items():
                    add(coords, destination)
            elif spec.kind == "cover":
                add(hotspots["next"], "contents")
            elif spec.kind == "divider":
                section_index = section_ids.index(spec.section)
                add(hotspots["contents"], "contents")
                add(hotspots["previous"], section_ids[section_index - 1] if section_index else "contents")
                add(
                    hotspots["next"],
                    section_ids[section_index + 1] if section_index + 1 < len(section_ids) else "contents",
                )
            elif spec.kind == "journal":
                add(hotspots["contents"], "contents")
                add(hotspots["section_home"], spec.section)
                add(hotspots["previous"], pages[index - 1].anchor)
                add(hotspots["next"], pages[index + 1].anchor if index + 1 < len(pages) else "contents")
            elif spec.kind == "end":
                add(hotspots["contents"], "contents")

            if annotations:
                page.obj.Annots = annotations

        pdf.save(output_pdf, linearize=True, compress_streams=True)


def build() -> Path:
    config = load_config()
    pages = expand_pages(config)
    source_width, source_height = verify_assets(pages, float(config.get("aspect_tolerance", 0.002)))
    page_size = config.get("page_size_points")
    if page_size:
        width, height = (float(page_size[0]), float(page_size[1]))
    else:
        width, height = source_width, source_height
    output = ROOT / config["output"]
    output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="archive-build-") as temp_dir:
        base_pdf = Path(temp_dir) / "base.pdf"
        linked_pdf = Path(temp_dir) / "linked.pdf"
        document = fitz.open()
        for page in pages:
            add_artwork(document, page.asset, fitz.Rect(0, 0, width, height))

        toc = []
        for index, page in enumerate(pages):
            if page.kind == "divider":
                toc.append([1, page.section_title, index + 1])
        document.set_toc(toc)
        document.set_metadata(
            {
                "title": config["title"],
                "subject": "Interactive dark-academia gothic reading journal",
                "creator": "The Archive of Obsessions modular PDF generator",
            }
        )
        document.save(base_pdf, garbage=4, deflate=True)
        document.close()

        add_named_navigation(base_pdf, linked_pdf, config, pages)
        shutil.copyfile(linked_pdf, output)
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build The Archive of Obsessions interactive PDF.")
    parser.parse_args()
    try:
        result = build()
    except Exception as exc:
        print(f"Build failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
    print(f"Built: {result}")
