# The Archive of Obsessions

Modular source project for a print-quality, interactive PDF reading journal.

## Quick start

1. Place artwork in the matching folders under `assets/`.
2. Use the exact filenames listed in `journal.yaml`.
3. Install dependencies:

   ```powershell
   python -m pip install -r requirements.txt
   ```

4. Build and validate:

   ```powershell
   python build.py
   python validate.py
   ```

The finished file is written to `output/The Archive of Obsessions.pdf`.

## Editable web journal

An editable, browser-based edition is available in `web-app/`. It preserves the
original artwork and adds autosaved text, images, ratings, checkboxes, searchable
navigation, reusable page templates, backup/restore, and print-to-PDF export.

For the simplest start, double-click `Start Editable Journal.cmd`, or run:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/web-app/`. See `web-app/README.md` for the full
editing, backup, export, and template guide.

## Artwork rules

- PDF pages are imported directly, without rasterizing.
- Images are embedded at their original resolution.
- Artwork is never cropped, stretched, recolored, or altered.
- `page_size_points` in `journal.yaml` establishes the final page size.
- Differently proportioned artwork is centered and scaled proportionally on black.
  It is never cropped or stretched.

## Navigation architecture

`journal.yaml` is the single source of truth for page order, repeat counts, anchors,
and hotspot positions. The build creates:

- named destinations for contents, every section, and every journal page;
- invisible internal links;
- a section bookmark panel;
- previous/next links resolved from logical anchors rather than hard-coded page numbers.

To add pages later, change a section's `count` or add another page entry, then rebuild.
No navigation coordinates or destination page numbers need to be rewritten.

A section may also use an explicit list of distinct files instead of a repeated template:

```yaml
- id: future_expansion
  title: Future Expansion
  divider: assets/dividers/future_expansion.pdf
  pages:
    - assets/future_expansion/page_001.pdf
    - assets/future_expansion/page_002.pdf
```

## Hotspot coordinates

Hotspots use normalized coordinates in the form `[left, top, right, bottom]`, where
`0,0` is the top-left and `1,1` is the bottom-right. The defaults place invisible
navigation zones along the page edges. Adjust them in `journal.yaml` to align with
visible artwork controls.

## Fillable fields

The generator deliberately leaves artwork untouched. Optional form fields can be
added later in `build.py` after the exact writing-area coordinates are confirmed.
PDF form behavior varies considerably across annotation apps, while internal links
and bookmarks are broadly compatible.
