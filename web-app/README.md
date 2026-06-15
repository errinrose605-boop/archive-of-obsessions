# The Archive of Obsessions - Editable Web Journal

This local web app preserves the original 161-page journal artwork and adds an editable layer for text, ratings, checkboxes, notes, and uploaded images.

## Start the journal

From the `ArchiveOfObsessions` folder, run:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/web-app/`.

No account, subscription, build step, or paid service is required.

## How saving works

- Changes save automatically in the browser's local storage.
- Uploaded images are stored with the journal data.
- Use **••• > Download backup** regularly to save a portable JSON backup.
- Use **••• > Restore backup** to load that file on this or another browser.

## Editing

- Click any highlighted text area to type.
- Click stars, flames, and checkboxes to set ratings and statuses.
- Click an empty image area or **Add image** to upload a cover or photo.
- Click the printed rows on the journal's Contents page to open a section.
- Click a page's printed **Close Archive Entry** / return area to go back to Contents.
- Use **Add text** for movable custom notes.
- Use **Duplicate** or **New page** to grow the journal.
- Move and delete pages from the **•••** menu.

## PDF export and printing

Choose **Export current page**, **Export current section**, or **Export entire journal** from the **•••** menu. In the browser print window, choose **Save as PDF** and enable background graphics.

## Adding templates

Reusable templates live in `data.js` under `templateCatalog`. A template contains:

- `label`: its name in the New Page menu
- `artwork`: the original image path
- `fields`: reusable editable zones using percentage-based positions

Each field uses `x`, `y`, `w`, and `h` percentages, so it remains aligned at every zoom level. Supported field types are `text`, `textarea`, `rating`, `checks`, and `image`.

## Architecture

- `index.html`: app structure
- `styles.css`: gothic interface, page layout, and print rules
- `data.js`: reusable templates and the original 161-page manifest
- `app.js`: editing, storage, navigation, search, page management, backup, and export

The original files in `assets/` remain the visual source of truth and are never modified.
