# PDF Analysis and Template Map

## Source audit

- Source of truth: `output/The Archive of Obsessions - Keeper Moved - Copy.pdf`
- Total pages: 157
- Page size: 512 × 768 points
- Aspect ratio: 2:3 portrait
- Active original artwork templates: 17
- Page structure source: `journal.yaml`

The PDF is image-based. The web journal therefore preserves each original page as
an untouched background and places reusable, percentage-positioned editing controls
above it.

## Original page sequence

| Pages | Section | Structure |
| --- | --- | --- |
| 1-2 | Front matter | Main cover and contents |
| 3-8 | Library | 6 editable nine-cover gallery pages |
| 9-19 | Series | Divider and 10 entry pages |
| 20-30 | Standalones | Divider and 10 entry pages |
| 31-51 | Hall of Fame | Divider and 20 alternating series/standalone entries |
| 52-102 | Book Boyfriends | Divider, collection page, and 49 profiles |
| 103-123 | DNF Graveyard | Divider and 20 autopsy reports |
| 124-149 | Future Obsessions | Divider and 25 alternating list pages |
| 150-156 | Reading Stats | Keeper's Ledger cover and 6 Archive Report pages |
| 157 | End matter | End cover |

## Reusable editable templates

- Library gallery: 9 independent cover uploads
- Series entry: cover, title, author, star rating, series list, statuses, synopsis
- Standalone entry: cover, title, author, star/spice ratings, distinctions, statuses, synopsis
- Hall of Fame series entries: eight independent covers, title, author, date, induction notes, character, and favourite book
- Hall of Fame standalone entries: cover, title, author, date, induction notes, character, and diamond reason
- Book Boyfriend collection: portrait and name gallery
- Book Boyfriend profile: portrait, character/book details, flags, danger rating, tropes, risk, notes
- DNF autopsy: case details, cause/symptom checklists, final words, resurrection potential, notes
- Future Obsessions: eight editable parchment cards
- Archive Report: five stat columns, three notable reads, plot twist, and haunted-by notes

Divider, cover, contents, and end pages retain their original artwork and support
freely placed text or image elements through the editor toolbar.

## Design decisions

- Original images remain unchanged and are never rasterized again.
- Repeated pages are generated from reusable templates in `data.js`.
- All positions use percentages so controls remain aligned at different zoom levels.
- IndexedDB is the primary local store; localStorage is a fallback.
- Browser printing provides high-quality, free PDF export with the original artwork.
- Navigation uses invisible hotspots aligned to the printed Contents and return controls.
- No server-side database, account, subscription, or paid service is required.
