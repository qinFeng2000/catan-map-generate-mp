# Board DOM Tile Overlap Design

## Goal

Remove the visible hairline seams between adjacent board hexes without changing board geometry, tile order, reveal timing, or the exported Canvas image.

## Design

- Expand only `sea-hex` and `land-hex` polygon points radially from each polygon center.
- Use one render-coordinate pixel of expansion. The page's render coordinates are twice its CSS display size, so this produces about 0.5 CSS pixel of overlap.
- Recompute each expanded polygon's bounds and local `clip-path` from the expanded points so the extra area is not clipped by the original element box.
- Leave harbor openings, number tokens, text, and legend polygons unchanged.
- Keep the existing center-out reveal animation and layer ordering unchanged.

## Verification

- Add a model test proving tile bounds expand by one render pixel and the resulting clip path still describes the same regular hex shape.
- Add a model test proving non-tile polygons are not expanded.
- Run the focused Board DOM tests, full test suite, TypeScript check, and diff whitespace check.
