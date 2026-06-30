# DOM Map Rendering and Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the visible map with DOM/CSS, reveal hexes from the center outward after successful generation, retain Canvas sharing, and show native Taro loading during map searches.

**Architecture:** Keep `createBoardScene` as the canonical layout source. A pure DOM-scene adapter converts its draw commands into percentage-positioned layers and reveal timing metadata; `BoardDom` renders those layers while the existing offscreen `BoardCanvas` remains the share-image renderer. A page generation task owns the native loading lifecycle and exception normalization.

**Tech Stack:** Taro 4, React 18, TypeScript, Sass, Vitest

---

### Task 1: Centralize the generation loading lifecycle

**Files:**
- Create: `src/pages/index/generation-task.ts`
- Create: `tests/generation-task.test.ts`
- Modify: `tests/setup.ts`
- Modify: `src/pages/index/use-board-generator.ts`
- Modify: `tests/page-canvas-structure.test.ts`

- [ ] **Step 1: Add Taro loading spies and write failing lifecycle tests**

Add `showLoading` and `hideLoading` spies to the default Taro mock in `tests/setup.ts`. Create `tests/generation-task.test.ts` with success, no-solution, and thrown-error cases. Each case calls the missing `runPageGeneration`; assert `showLoading({ title: '匹配规格地图', mask: true })`, the generator arguments, a single `hideLoading` call, and the normalized unexpected failure:

```ts
{
  ok: false,
  diagnostics: { attempts: 0, validCandidates: 0, resourceNodes: 0, numberNodes: 0, pruned: {} },
  message: '地图生成失败，请重试',
}
```

- [ ] **Step 2: Run the lifecycle test and verify RED**

Run: `pnpm test -- tests/generation-task.test.ts`

Expected: FAIL because `@/pages/index/generation-task` does not exist.

- [ ] **Step 3: Implement the generation task**

Create `src/pages/index/generation-task.ts`:

```ts
import Taro from '@tarojs/taro'
import type { BoardVersion } from '@/domain/board'
import type { GeneratorRules } from '@/domain/rules'
import { generateBoard, type GenerateBoardResult } from '@/generator/generate-board'

type BoardGenerator = (version: BoardVersion, rules: GeneratorRules) => Promise<GenerateBoardResult>

const unexpectedFailure = (): GenerateBoardResult => ({
  ok: false,
  diagnostics: { attempts: 0, validCandidates: 0, resourceNodes: 0, numberNodes: 0, pruned: {} },
  message: '地图生成失败，请重试',
})

export const runPageGeneration = async (
  version: BoardVersion,
  rules: GeneratorRules,
  generate: BoardGenerator = generateBoard,
): Promise<GenerateBoardResult> => {
  Taro.showLoading({ title: '匹配规格地图', mask: true })
  try {
    return await generate(version, rules)
  } catch {
    return unexpectedFailure()
  } finally {
    Taro.hideLoading()
  }
}
```

Replace the direct `generateBoard` import and call in `use-board-generator.ts` with `runPageGeneration(version, rules)`. Add a source assertion to `tests/page-canvas-structure.test.ts` proving every page generation routes through this task.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm test -- tests/generation-task.test.ts tests/page-canvas-structure.test.ts`

Expected: both files pass.

- [ ] **Step 5: Commit the loading lifecycle**

```bash
git add src/pages/index/generation-task.ts src/pages/index/use-board-generator.ts tests/generation-task.test.ts tests/page-canvas-structure.test.ts tests/setup.ts
git commit -m "feat: show loading while matching maps"
```

### Task 2: Convert draw commands into a DOM scene

**Files:**
- Create: `src/components/BoardDom/model.ts`
- Create: `tests/board-dom-model.test.ts`

- [ ] **Step 1: Write failing DOM-scene conversion tests**

Create `tests/board-dom-model.test.ts` using a small command fixture with a center land hex, an edge sea hex, a harbor opening whose first point is the sea center, a number circle/text at the land center, and legend layers. Assert:

- `clear` becomes the scene background and is not emitted as a layer.
- Polygon bounding boxes use percentage `left`, `top`, `width`, `height` and local percentage `clipPath` points.
- Circles and text preserve their fill/color, font size, font weight, and alignment metadata.
- The center hex delay is lower than the edge hex delay.
- Number layers reuse the center land delay; the harbor reuses the edge sea delay.
- Legend layers have no reveal role or delay.

Import the missing API as:

```ts
import { createBoardDomScene } from '@/components/BoardDom/model'
```

- [ ] **Step 2: Run the model test and verify RED**

Run: `pnpm test -- tests/board-dom-model.test.ts`

Expected: FAIL because `@/components/BoardDom/model` does not exist.

- [ ] **Step 3: Implement the pure DOM-scene adapter**

Create `src/components/BoardDom/model.ts` with these public types:

```ts
export type BoardDomLayerKind = 'polygon' | 'circle' | 'text'
export type BoardDomRevealRole = 'tile' | 'detail'

export interface BoardDomLayer {
  key: string
  kind: BoardDomLayerKind
  tag?: string
  text?: string
  style: Record<string, string | number>
  revealRole?: BoardDomRevealRole
  revealDelayMs?: number
}

export interface BoardDomScene {
  background: string
  layers: readonly BoardDomLayer[]
}

export const createBoardDomScene = (
  commands: readonly DrawCommand[],
  width: number,
  height: number,
  designWidth: number,
): BoardDomScene
```

Use command tags to classify reveal behavior:

```ts
const tileTags = new Set(['sea-hex', 'land-hex'])
const detailTags = new Set(['harbor-opening', 'number-token', 'number-text'])
const MAX_REVEAL_DELAY_MS = 420
```

Collect tile centers, calculate each tile's Euclidean distance from the scene center, normalize by the maximum distance, and round to a delay from `0` to `420ms`. Match number centers directly to the nearest land tile center and harbor openings by their first polygon point to the nearest sea tile center. Convert all coordinates to percentages; convert command font sizes to display rpx using `rpx(command.fontSize * designWidth / width)`.

- [ ] **Step 4: Run the model test and verify GREEN**

Run: `pnpm test -- tests/board-dom-model.test.ts`

Expected: all model tests pass.

- [ ] **Step 5: Commit the scene adapter**

```bash
git add src/components/BoardDom/model.ts tests/board-dom-model.test.ts
git commit -m "feat: adapt board scene commands for DOM"
```

### Task 3: Render and animate the visible DOM map

**Files:**
- Create: `src/components/BoardDom/index.tsx`
- Create: `src/components/BoardDom/index.scss`
- Create: `tests/board-dom-structure.test.ts`
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/index.scss`
- Modify: `tests/page-canvas-structure.test.ts`

- [ ] **Step 1: Write failing component and page structure tests**

Create `tests/board-dom-structure.test.ts` and extend `tests/page-canvas-structure.test.ts`. Source assertions must prove:

- `BoardDom` uses Taro `View` and `Text`, calls `createBoardDomScene`, applies `--board-reveal-delay`, and contains no `Canvas`.
- The stylesheet defines `board-hex-reveal` and `board-detail-reveal` keyframes.
- `index.tsx` imports `BoardDom`, renders it with `key={`${visibleBoard.version}-${visibleBoard.seed}-${visibleBoard.createdAt}`}`, and no longer renders a visible `board-canvas` or `.map-loading`.
- `index.tsx` still renders exactly one `BoardCanvas` with `canvasId='share-canvas'` and `offscreen`.

- [ ] **Step 2: Run structure tests and verify RED**

Run: `pnpm test -- tests/board-dom-structure.test.ts tests/page-canvas-structure.test.ts`

Expected: FAIL because `BoardDom` and its styles do not exist and the page still uses a visible Canvas.

- [ ] **Step 3: Implement `BoardDom`**

Create `src/components/BoardDom/index.tsx`. Its props are:

```ts
interface Props {
  commands: readonly DrawCommand[]
  designWidth: number
  designHeight: number
  renderWidth: number
  renderHeight: number
}
```

Build the scene with `createBoardDomScene(commands, renderWidth, renderHeight, designWidth)`. Render a root `View.board-dom` sized with `rpx(designWidth)` and `rpx(designHeight)`, and map layers in original command order. Polygon/circle layers render as `View`; text layers render as `Text`. Animated layers receive either `board-dom__layer--tile` or `board-dom__layer--detail` plus an inline `--board-reveal-delay` value.

- [ ] **Step 4: Add center-out CSS animation**

Create `src/components/BoardDom/index.scss`:

```scss
.board-dom {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.board-dom__layer { position: absolute; box-sizing: border-box; }
.board-dom__text { white-space: nowrap; line-height: 1; }

.board-dom__layer--tile {
  animation: board-hex-reveal 320ms cubic-bezier(.22, 1, .36, 1) var(--board-reveal-delay) both;
  transform-origin: center;
  will-change: transform, opacity;
}

.board-dom__layer--detail {
  animation: board-detail-reveal 180ms ease-out var(--board-reveal-delay) both;
  will-change: opacity;
}

@keyframes board-hex-reveal {
  from { opacity: 0; transform: scale(.08) rotate(-8deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}

@keyframes board-detail-reveal {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 5: Replace only the visible Canvas**

In `src/pages/index/index.tsx`, replace the visible `BoardCanvas` with:

```tsx
<BoardDom
  key={`${visibleBoard.version}-${visibleBoard.seed}-${visibleBoard.createdAt}`}
  commands={commands}
  designWidth={pageCanvasSize.width}
  designHeight={pageCanvasSize.height}
  renderWidth={pageRenderSize.width}
  renderHeight={pageRenderSize.height}
/>
```

Remove the `.map-loading` node and its SCSS rule. Leave the offscreen share `BoardCanvas` unchanged.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `pnpm test -- tests/board-dom-model.test.ts tests/board-dom-structure.test.ts tests/page-canvas-structure.test.ts tests/board-canvas.test.ts tests/share-image.test.ts`

Expected: all focused tests pass.

- [ ] **Step 7: Commit DOM rendering and reveal animation**

```bash
git add src/components/BoardDom src/pages/index/index.tsx src/pages/index/index.scss tests/board-dom-structure.test.ts tests/page-canvas-structure.test.ts
git commit -m "feat: reveal visible maps with DOM tiles"
```

### Task 4: Verify all supported targets

**Files:**
- Verify only

- [ ] **Step 1: Run the complete automated suite**

Run: `pnpm test`

Expected: all Vitest files and tests pass.

- [ ] **Step 2: Run TypeScript validation**

Run: `pnpm run typecheck`

Expected: exit code 0 with no diagnostics.

- [ ] **Step 3: Build H5**

Run: `pnpm run build:h5`

Expected: exit code 0.

- [ ] **Step 4: Build the WeChat mini program**

Run: `pnpm run build:weapp`

Expected: exit code 0.

- [ ] **Step 5: Inspect the final patch**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended source, test, and plan changes are present.
