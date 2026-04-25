# ATS Resume Builder

A zero-build, fully client-side resume builder. Open `index.html` in a browser — that's it.

## Features
- **10 ATS-friendly templates** — switch instantly from the top bar.
- **Dynamic content** — every field updates the live preview as you type.
- **Dynamic sections** — add custom sections (e.g., *Achievements*, *Publications*, *Volunteering*, *Certifications*). Pick a section type:
  - **List** — bulleted items (great for Achievements).
  - **Experience** — role / org / dates / bullet description.
  - **Projects** — name / link / tech / bullet description.
  - **Education** — degree / school / dates / details.
  - **Skills** — grouped comma-separated tags.
  - **Free text** — paragraph.
- **Bullet support** in project & experience descriptions — type one bullet per line.
- **Reorder / delete** sections and items with ↑ ↓ ✕ buttons.
- **Auto-save** to `localStorage`. Manual Save / Load / Reset buttons too.
- **Download PDF** via the browser print dialog → *Save as PDF* (A4).

## Run
Just double-click `index.html`, or:

```powershell
# Optional: simple local server
python -m http.server 8080
# then open http://localhost:8080
```

## ATS-friendliness notes
- All text is real text (no images, no icons-as-images).
- Single-column layouts (templates 1–9) are most ATS-safe.
- Template 10 uses a simple two-column layout with a logical reading order.
- Avoid using emojis or graphics-heavy customizations if your target ATS is strict.

## Files
- `index.html` — UI shell (editor + preview).
- `styles.css` — app chrome + 10 template styles + print rules.
- `app.js` — state, dynamic sections/items, render, persistence, export.
