PATHWAYS — Static Site
=========================

This is a static HTML/CSS/JS site for a student nonprofit that lists internships and lets students filter by area (and other fields when available).

How to use
----------
1. Unzip the archive.
2. Open `index.html` in a browser.
3. Filters and sorting work locally with JavaScript (no backend needed).

Data
----
- Source CSV: `very good table - Ignore the last column with notes and if you didn....csv`
- We ignored the last column per your instruction.
- Detected columns:
{
  "title_col": null,
  "org_col": null,
  "area_col": null,
  "industry_col": null,
  "deadline_col": null,
  "duration_col": null,
  "paid_col": null,
  "link_col": null,
  "desc_col": null
}

- The processed JSON lives at `data/internships.json` and includes all original columns so you can display more fields if you like. You can replace this file later with updated data (same columns) and the UI will refresh automatically.

Customization
-------------
- Change the nonprofit name, nav, or hero copy in `index.html`.
- Adjust styles in `assets/styles.css` (uses CSS variables at the top).
- Tweak UI behavior in `assets/script.js`.

