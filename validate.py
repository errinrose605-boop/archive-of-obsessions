from __future__ import annotations

import sys
from pathlib import Path

import pikepdf
import yaml

from build import ROOT, expand_pages


def validate() -> None:
    with (ROOT / "journal.yaml").open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    expected = expand_pages(config)
    output = ROOT / config["output"]
    if not output.exists():
        raise FileNotFoundError(f"Build output does not exist: {output}")

    with pikepdf.open(output) as pdf:
        if len(pdf.pages) != len(expected):
            raise ValueError(f"Expected {len(expected)} pages, found {len(pdf.pages)}")
        if "/Outlines" not in pdf.Root:
            raise ValueError("Bookmark outline is missing")
        names = pdf.Root.get("/Names", {}).get("/Dests", {}).get("/Names", [])
        anchors = {str(names[index]) for index in range(0, len(names), 2)}
        missing = sorted({page.anchor for page in expected} - anchors)
        if missing:
            raise ValueError(f"Missing named destinations: {', '.join(missing)}")
        linked_pages = sum(1 for page in pdf.pages if "/Annots" in page.obj)

    print(f"Validated {len(expected)} pages, {len(anchors)} named destinations, {linked_pages} linked pages.")


if __name__ == "__main__":
    try:
        validate()
    except Exception as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)

