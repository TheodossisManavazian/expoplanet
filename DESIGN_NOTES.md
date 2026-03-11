# Design Notes & Decisions

## Data Cleaning

### Filtering to Default Parameter Set
- The raw dataset has multiple rows per planet (repeated measurements over the years).
- We filter to `default_flag = 1` to get one canonical row per planet (most up-to-date info).
- Result: 6,137 unique planets.

### Missing Data
- **Planet radius**: 1,582 planets (~26%) are missing radius. These still appear on the scatter plot but are given a default dot size. Good question for peer feedback: should we estimate these, leave them as default size, or mark them differently?
- **Orbital period**: 352 planets (~6%) missing. Mostly Microlensing (259) and Imaging (72) — these methods detect planets from single events/snapshots, so orbits often can't be determined. These planets are excluded from the scatter plot but still appear in both bar charts.
- **Distance**: 138 planets (~2%) missing. These are excluded from the scatter plot but still appear in both bar charts.
- **Total excluded from scatter plot**: 456 planets (~7.4%) missing either orbital period or distance.

### Discovery Method Grouping
- 11 discovery methods total, but the bottom 7 combined account for only 82 planets.
- Grouped into "Other": Transit Timing Variations (39), Eclipse Timing Variations (17), Orbital Brightness Modulation (9), Pulsar Timing (8), Astrometry (6), Pulsation Timing Variations (2), Disk Kinematics (1).
- Keeps the legend clean (5 categories instead of 11). Rubric tip says "keep legends to 7 or fewer items."
- Footnote on the dashboard explains which methods are in "Other."

## Chart Design Decisions

### Chart 1: Discoveries by Year (Stacked Bar with √ Scale)
- Originally raw-count stacked bars, but Transit dominates (~74%) making small methods and early years nearly invisible/unhoverable.
- Considered normalized 100% bars, but that loses the "wow factor" of seeing how many planets were discovered each year (e.g. the big spike in 2014-2016). Reverted.
- Solution: **square root scale on y-axis**. Compresses tall bars and stretches short ones so early years (1992-2005) are visible and hoverable, while still conveying relative magnitude.
- Each method's bar segment = `(methodCount / yearTotal) * sqrt(yearTotal)` so the stacked total = `sqrt(yearTotal)` and the y-axis tick labels align correctly.
- Y-axis ticks show real counts (0, 10, 200, 500, 1000, 1500) positioned at their sqrt values. Label says "(√ scale)" for transparency.
- Rich hover tooltip shows full year breakdown: total count + each method with count, percentage, and a color-coded dot. White background for readability.

### Chart 2: Discoveries by Method (Bar with √ Scale)
- One bar per method, colored to match. Shows total counts across all years.
- Also uses √ scale on y-axis so smaller methods (Imaging, Other) are visible next to Transit.
- Tooltip shows only the hovered method: color-coded dot + count (e.g. "● 4513 planets"). No full breakdown or percentages here since each bar already represents the whole total for that method — unlike chart 1 where each bar is a stacked mix. White background matches chart 1 styling.
- Acts as a visual legend and is clickable for cross-filtering.

### Chart 3: Scatter Plot (Orbital Period vs Distance)
- X = orbital period (days), Y = distance (parsecs), both on **log scale** since values span many orders of magnitude.
- Dot size = planet radius (missing radius → default small size).
- Dot color = discovery method.
- Opacity at 0.6 to handle overlapping dots.
- 456 planets excluded (missing orbital period or distance); they still appear in both bar charts.

### Color Palette — Paul Tol Bright
- Switched from Tableau 10 subset to **Paul Tol's Bright qualitative scheme** (with yellow swapped for purple).
- Researched Okabe-Ito/Wong, Tableau Color Blind 10, IBM Design Language, ColorBrewer Dark2, and Paul Tol. Chose Tol Bright for these reasons:
  1. **Colorblind accessible** — verified safe across all three CVD types (deuteranopia, protanopia, tritanopia). Rubric requires accessible palettes; inaccessible colors = C grade.
  2. **Holds up at low opacity** — scatter plot uses 0.45 opacity with ~5,700 overlapping dots. Palettes with similar hues (IBM blue/purple) or greys (Tableau) fall apart when blended. Tol's 5 hues are far enough apart to stay distinguishable.
  3. **No yellow on white** — many palettes include yellow which washes out on white backgrounds. Swapped Tol's yellow for purple to maintain contrast.
  4. **Passes greyscale test** — enough luminance variation across the 5 colors to remain somewhat distinguishable in greyscale (rubric tip: "run the greyscale test").
  5. **No grey for a data category** — previous "Other" was grey (#bab0ac), nearly invisible at low opacity on white. Purple (#AA3377) is visible at any opacity.
- Final palette:
  - Transit: `#4477AA` (Blue)
  - Radial Velocity: `#EE6677` (Red)
  - Microlensing: `#228833` (Green)
  - Imaging: `#66CCEE` (Cyan)
  - Other: `#AA3377` (Purple)
- Same colors used consistently across all three charts (Gestalt similarity principle).

### Gestalt Principles Applied
- **Proximity**: Two bar charts side by side in the top row, grouped as "overview" views.
- **Enclosure**: Each chart in a white card with border-radius and shadow (figure/ground separation from gray background).
- **Similarity**: Consistent colors for discovery methods across all charts.
- **Continuity**: Grid-aligned layout with consistent padding and margins.

### Cross-Filtering (Interaction)
- **Multi-select**: users can click multiple years in chart 1 and/or multiple methods in chart 2.
- Chart 1 filters by selected methods only (all years remain visible/clickable).
- Chart 2 filters by selected years only (all methods remain visible/clickable).
- Chart 3 (scatter) gets both filters applied.
- Visual feedback: unselected years dim to 20% opacity in chart 1; unselected methods turn gray in chart 2.
- A filter bar appears above the charts showing active filters with a "Clear Filters" button.
- Clicking a selected item again deselects it.
- **Known issue for final version**: click detection on stacked bar segments (chart 1) and chart 2 bars is sometimes unreliable. Plotly's click events don't always fire on small or zero-height segments. Consider switching to D3 custom bars or adding invisible overlay traces for more reliable click targets.

## Peer Feedback Questions
- How should we handle the 1,582 planets with missing radius on the scatter plot? Default dot size, special marker, or exclude?
- Is the √ scale on chart 1 intuitive, or confusing?
- Is the "Other" grouping for minor methods acceptable, or should we show all 11?
- Is multi-select filtering intuitive, or should it be single-select?
- Is the click target issue noticeable/confusing?
