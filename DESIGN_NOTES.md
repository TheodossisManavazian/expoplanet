# Design Notes & Decisions

**Disclaimer:** I used Claude Code to help with writing the code for this. i manually checked the changes made by claude.

## Data Cleaning
- Raw dataset has multiple rows per planet. Filtered to `default_flag = 1` → 6,137 unique planets.
- Missing data: 1,582 missing radius (26%), 352 missing orbital period (6%), 138 missing distance (2%).
- Planets missing orbital period or distance (456 total) are excluded from the scatter plot but appear in both bar charts.
- Bottom 7 discovery methods (82 planets total) grouped into "Other." Footnote on dashboard lists them.

## Chart 1: Discoveries by Year (Stacked Bar, √ Scale)
- Transit dominates (~74%), making small methods and early years invisible at raw scale.
- Tried normalized 100% bars but lost the "wow factor" of absolute counts. Reverted.
- Solution: √ scale on y-axis. Each segment = `(count/total) * √total` so stacked total = `√total`.
- Y-axis ticks show real counts at √ positions. Label says "(√ scale)."
- Hover tooltip shows full year breakdown with color-coded dots, counts, and percentages.

## Chart 2: Discoveries by Method (Bar, √ Scale)
- One bar per method with √ scale so smaller methods are visible next to Transit.
- Tooltip shows color dot + count. "Other" tooltip includes sub-method breakdown.
- Acts as a clickable visual legend for cross-filtering.

## Chart 3: Scatter Plot (Orbital Period vs Distance)
- X = orbital period (days, log scale), Y = distance (light-years, √ scale).
- Dot size = `√(planet_radius) * 6` (missing radius → default size 8). Opacity 0.45.
- Hover shows planet name, orbital period, distance, radius, discovery year, and exact method.

## Color Palette
- Custom qualitative palette, tested for colorblind accessibility (all 3 CVD types) and greyscale distinguishability.
- Luminance values spaced >30 apart: Transit 52, Radial Velocity 84, Microlensing 138, Imaging 173, Other 234.
- Final: Transit `#183B5A`, Radial Velocity `#EDA04A`, Microlensing `#45B850`, Imaging `#D4F1FF`, Other `#8C3560`.
- Consistent colors across all three charts (Gestalt similarity).

## Layout & Styling
- Gestalt principles: proximity (bar charts side by side), enclosure (cards), similarity (colors), continuity (grid layout).

## Cross-Filtering
- Multi-select: click years in chart 1 and/or methods in chart 2.
- Each chart filters by the OTHER dimension only, keeping all items clickable.
- Scatter plot gets both filters. Unselected items dim (opacity 0.2 or dark gray).
- Filter bar shows active filters with "Clear Filters" button.

## Peer Feedback Questions
- How to handle 1,582 planets with missing radius? Default dot size, special marker, or exclude?
- Is √ scale intuitive or confusing?
- Is "Other" grouping acceptable, or show all 11 methods?
- Is multi-select filtering intuitive, or should it be single-select?
