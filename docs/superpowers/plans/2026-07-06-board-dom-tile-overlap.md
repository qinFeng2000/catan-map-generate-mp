# Board DOM Tile Overlap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate anti-aliased hairline seams by overlapping adjacent sea and land tile polygons by about 0.5 CSS pixel.

**Architecture:** Keep board coordinates and scene commands unchanged. In the Board DOM adapter only, uniformly scale tile polygon points around their center by one render-coordinate pixel before calculating element bounds and `clip-path`; non-tile polygons remain unchanged.

**Tech Stack:** TypeScript, React/Taro, CSS `clip-path`, Vitest

---

### Task 1: Add regression coverage for tile-only overlap

**Files:**
- Modify: `tests/board-dom-model.test.ts`

- [ ] **Step 1: Update the tile-position test to require expanded bounds**

For the existing `hexAt(100, 50, ...)` fixture, assert that one render pixel of uniform radial scaling changes the tile bounds while preserving its local hex clip path:

```ts
expect(land.style).toMatchObject({
  left: '39.5528%',
  top: '29.1056%',
  width: '20.8944%',
  height: '41.7889%',
  backgroundColor: '#3f8f4b',
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
})
```

- [ ] **Step 2: Add a test proving non-tile polygons retain their original bounds**

```ts
it('does not expand non-tile polygons', () => {
  const scene = createBoardDomScene(commands, 200, 100, 400)
  const swatch = scene.layers.find((layer) => layer.tag === 'resource-legend-swatch')!

  expect(swatch.style).toMatchObject({
    left: '5%',
    top: '5%',
    width: '5%',
    height: '10%',
  })
})
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `pnpm test -- tests/board-dom-model.test.ts`

Expected: the expanded tile-bound assertions fail because tile polygons still use their original points.

### Task 2: Expand tile polygons in the DOM adapter

**Files:**
- Modify: `src/components/BoardDom/model.ts`
- Test: `tests/board-dom-model.test.ts`

- [ ] **Step 1: Add a tile overlap constant and polygon expansion helper**

```ts
const TILE_OVERLAP_RENDER_PX = 1

const expandPolygon = (points: readonly Point[], amount: number): Point[] => {
  const center = polygonCenter(points)
  const radius = Math.max(0, ...points.map((point) => distance(point, center)))
  if (radius === 0) return [...points]
  const scale = (radius + amount) / radius
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }))
}
```

- [ ] **Step 2: Apply expansion only while building tile polygon styles**

At the start of `polygonStyle`, select expanded points only for `sea-hex` and `land-hex`, then use those selected points for both bounds and local clip-path coordinates:

```ts
const points = TILE_TAGS.has(command.tag ?? '')
  ? expandPolygon(command.points, TILE_OVERLAP_RENDER_PX)
  : command.points
const bounds = polygonBounds(points)
```

Replace `command.points.map(localPoint)` with `points.map(localPoint)`.

- [ ] **Step 3: Run the focused tests and verify GREEN**

Run: `pnpm test -- tests/board-dom-model.test.ts tests/board-dom-structure.test.ts`

Expected: both test files pass.

- [ ] **Step 4: Run full verification**

Run: `pnpm test && pnpm run typecheck && git diff --check`

Expected: all tests pass, TypeScript exits successfully, and the diff has no whitespace errors.

- [ ] **Step 5: Review the final diff**

Run: `git diff -- src/components/BoardDom/model.ts tests/board-dom-model.test.ts`

Expected: only the tile-overlap helper, tile-only style application, and focused regression assertions are present.
