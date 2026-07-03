# Morandi Blue Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a replaceable Stone Blue Morandi theme that styles the page, rule panel, visible board, and exported share image without changing any existing resource tile colors or behavior.

**Architecture:** A typed theme registry is the single source of truth for UI, scene, and platform colors. The active theme becomes page CSS variables for component styles and is passed into board-scene generation for both DOM display and Canvas export; the existing `RESOURCE_COLORS` map remains outside the theme system and is protected by regression tests.

**Tech Stack:** Taro 4, React 18, TypeScript 5.9, Sass, Vitest, Taro Canvas 2D

---

## File structure

Create focused theme files under `src/theme/`:

- `src/theme/types.ts`: the complete `ThemeDefinition` contract.
- `src/theme/stone-blue.ts`: the confirmed Stone Blue theme values.
- `src/theme/registry.ts`: registered themes, `ThemeId`, `ACTIVE_THEME_ID`, and `activeTheme`.
- `src/theme/css-variables.ts`: pure conversion from a theme to CSS custom properties.
- `src/theme/index.ts`: public theme exports.
- `tests/theme.test.ts`: theme completeness, registry, CSS variables, and resource-color invariants.

Modify existing integration points:

- `src/renderer/board-scene.ts`: consume semantic scene colors while keeping resource colors independent.
- `tests/board-scene.test.ts`: verify theme colors reach DOM/Canvas draw commands and resources remain unchanged.
- `src/pages/index/index.tsx`: install CSS variables and pass the same active theme to display/share scenes.
- `src/components/RulePanel/index.tsx`: accept the theme and use its control accent.
- `src/app.config.ts`: use active platform colors for navigation and background.
- `tests/page-canvas-structure.test.ts`: assert page theme wiring.
- `tests/rule-panel-structure.test.ts`: assert rule-panel theme wiring.
- `tests/app-theme-structure.test.ts`: assert platform theme wiring.
- `src/pages/index/index.scss`: Stone Blue flat page and action styles using CSS variables.
- `src/components/RulePanel/index.scss`: flat themed drawer styles.
- `src/components/MetricSummary/index.scss`: themed summary surface.
- `src/app.scss`: pre-mount Stone Blue platform fallback.
- `tests/theme-style-structure.test.ts`: reject old orange/paper colors and shadows in themed UI styles.

### Task 1: Typed theme registry and CSS variables

**Files:**
- Create: `src/theme/types.ts`
- Create: `src/theme/stone-blue.ts`
- Create: `src/theme/registry.ts`
- Create: `src/theme/css-variables.ts`
- Create: `src/theme/index.ts`
- Create: `tests/theme.test.ts`

- [ ] **Step 1: Write the failing theme contract tests**

Create `tests/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RESOURCE_COLORS } from "@/renderer/board-scene";
import {
  ACTIVE_THEME_ID,
  activeTheme,
  stoneBlue,
  themeCssVariables,
  themeRegistry,
} from "@/theme";

describe("theme registry", () => {
  it("registers Stone Blue as the active replaceable theme", () => {
    expect(ACTIVE_THEME_ID).toBe("stoneBlue");
    expect(themeRegistry.stoneBlue).toBe(stoneBlue);
    expect(activeTheme).toBe(stoneBlue);
  });

  it("provides every confirmed Stone Blue semantic color", () => {
    expect(stoneBlue).toEqual({
      id: "stoneBlue",
      name: "石板蓝",
      ui: {
        page: "#DDE5EA",
        surface: "#EEF2F3",
        primary: "#647D8C",
        text: "#3E5664",
        muted: "#71838D",
        border: "#B9C8CF",
        overlay: "rgba(62, 86, 100, 0.38)",
        dangerSurface: "#E8DEDD",
        dangerText: "#805D5A",
        onPrimary: "#FFFFFF",
      },
      scene: {
        canvas: "#EEF2F3",
        numberToken: "#E9EDF0",
        numberText: "#3E5664",
        highProbabilityNumber: "#79534F",
        title: "#3E5664",
        mutedText: "#71838D",
        summaryText: "#526A76",
      },
      platform: {
        navigationBarBackground: "#DDE5EA",
        navigationBarTextStyle: "black",
      },
    });
  });

  it("maps UI semantic colors to CSS custom properties", () => {
    expect(themeCssVariables(stoneBlue)).toEqual({
      "--theme-page": "#DDE5EA",
      "--theme-surface": "#EEF2F3",
      "--theme-primary": "#647D8C",
      "--theme-text": "#3E5664",
      "--theme-muted": "#71838D",
      "--theme-border": "#B9C8CF",
      "--theme-overlay": "rgba(62, 86, 100, 0.38)",
      "--theme-danger-surface": "#E8DEDD",
      "--theme-danger-text": "#805D5A",
      "--theme-on-primary": "#FFFFFF",
    });
  });

  it("keeps resource tile colors outside the replaceable theme", () => {
    expect(RESOURCE_COLORS).toEqual({
      wood: "#3f8f4b",
      wool: "#8fd694",
      grain: "#f0c84b",
      brick: "#c8793d",
      ore: "#7d8996",
      desert: "#ead8a8",
      sea: "#69a9d2",
    });
    expect(stoneBlue).not.toHaveProperty("resourceColors");
  });
});
```

- [ ] **Step 2: Run the new test and verify the missing module failure**

Run:

```bash
pnpm vitest run tests/theme.test.ts
```

Expected: FAIL with a module resolution error for `@/theme`.

- [ ] **Step 3: Add the theme contract**

Create `src/theme/types.ts`:

```ts
export interface ThemeDefinition {
  id: string;
  name: string;
  ui: {
    page: string;
    surface: string;
    primary: string;
    text: string;
    muted: string;
    border: string;
    overlay: string;
    dangerSurface: string;
    dangerText: string;
    onPrimary: string;
  };
  scene: {
    canvas: string;
    numberToken: string;
    numberText: string;
    highProbabilityNumber: string;
    title: string;
    mutedText: string;
    summaryText: string;
  };
  platform: {
    navigationBarBackground: string;
    navigationBarTextStyle: "black" | "white";
  };
}
```

- [ ] **Step 4: Add the Stone Blue definition**

Create `src/theme/stone-blue.ts`:

```ts
import type { ThemeDefinition } from "./types";

export const stoneBlue = {
  id: "stoneBlue",
  name: "石板蓝",
  ui: {
    page: "#DDE5EA",
    surface: "#EEF2F3",
    primary: "#647D8C",
    text: "#3E5664",
    muted: "#71838D",
    border: "#B9C8CF",
    overlay: "rgba(62, 86, 100, 0.38)",
    dangerSurface: "#E8DEDD",
    dangerText: "#805D5A",
    onPrimary: "#FFFFFF",
  },
  scene: {
    canvas: "#EEF2F3",
    numberToken: "#E9EDF0",
    numberText: "#3E5664",
    highProbabilityNumber: "#79534F",
    title: "#3E5664",
    mutedText: "#71838D",
    summaryText: "#526A76",
  },
  platform: {
    navigationBarBackground: "#DDE5EA",
    navigationBarTextStyle: "black",
  },
} as const satisfies ThemeDefinition;
```

- [ ] **Step 5: Add the registry and active theme selection**

Create `src/theme/registry.ts`:

```ts
import { stoneBlue } from "./stone-blue";
import type { ThemeDefinition } from "./types";

export const themeRegistry = {
  stoneBlue,
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeId = keyof typeof themeRegistry;

export const ACTIVE_THEME_ID: ThemeId = "stoneBlue";
export const activeTheme = themeRegistry[ACTIVE_THEME_ID];
```

- [ ] **Step 6: Add the CSS variable adapter and public exports**

Create `src/theme/css-variables.ts`:

```ts
import type { CSSProperties } from "react";
import type { ThemeDefinition } from "./types";

export type ThemeCssVariables = CSSProperties &
  Record<`--theme-${string}`, string>;

export const themeCssVariables = (
  theme: ThemeDefinition,
): ThemeCssVariables => ({
  "--theme-page": theme.ui.page,
  "--theme-surface": theme.ui.surface,
  "--theme-primary": theme.ui.primary,
  "--theme-text": theme.ui.text,
  "--theme-muted": theme.ui.muted,
  "--theme-border": theme.ui.border,
  "--theme-overlay": theme.ui.overlay,
  "--theme-danger-surface": theme.ui.dangerSurface,
  "--theme-danger-text": theme.ui.dangerText,
  "--theme-on-primary": theme.ui.onPrimary,
});
```

Create `src/theme/index.ts`:

```ts
export { themeCssVariables } from "./css-variables";
export type { ThemeCssVariables } from "./css-variables";
export {
  ACTIVE_THEME_ID,
  activeTheme,
  themeRegistry,
} from "./registry";
export type { ThemeId } from "./registry";
export { stoneBlue } from "./stone-blue";
export type { ThemeDefinition } from "./types";
```

- [ ] **Step 7: Run the focused test and typecheck**

Run:

```bash
pnpm vitest run tests/theme.test.ts
pnpm typecheck
```

Expected: both commands PASS.

- [ ] **Step 8: Commit the theme registry**

```bash
git add src/theme tests/theme.test.ts
git commit -m "feat: add replaceable Stone Blue theme"
```

### Task 2: Theme the board scene without changing resource colors

**Files:**
- Modify: `src/renderer/board-scene.ts`
- Modify: `tests/board-scene.test.ts`

- [ ] **Step 1: Add failing renderer theme assertions**

In `tests/board-scene.test.ts`, extend imports:

```ts
import {
  createBoardScene,
  getPageCanvasSize,
  getShareCanvasSize,
  RESOURCE_COLORS,
} from "@/renderer/board-scene";
import { stoneBlue } from "@/theme";
```

Replace the existing hot-number expectation with:

```ts
it("uses the active theme for board chrome and keeps resource fills", () => {
  const { board, preset } = generatedFixture("base");
  const commands = createBoardScene(board, preset, {
    width: 700,
    height: 900,
    includeSummary: true,
    theme: stoneBlue,
  });

  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "clear",
      color: stoneBlue.scene.canvas,
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "circle",
      tag: "number-token",
      fill: stoneBlue.scene.numberToken,
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "text",
      tag: "share-title",
      color: stoneBlue.scene.title,
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "polygon",
      tag: "land-hex",
      fill: RESOURCE_COLORS.wood,
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "polygon",
      tag: "sea-hex",
      fill: RESOURCE_COLORS.sea,
    }),
  );
});

it("uses the themed high-probability color for 6 and 8", () => {
  const commands = createBoardScene(hotNumberFixture, basePreset, {
    width: 700,
    height: 700,
    includeSummary: false,
    theme: stoneBlue,
  });
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "text",
      text: "6",
      color: stoneBlue.scene.highProbabilityNumber,
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      kind: "text",
      text: "8",
      color: stoneBlue.scene.highProbabilityNumber,
    }),
  );
});
```

- [ ] **Step 2: Run the focused renderer test and verify it fails**

Run:

```bash
pnpm vitest run tests/board-scene.test.ts
```

Expected: FAIL because `SceneOptions` does not accept `theme` and the draw commands still use the old hard-coded colors.

- [ ] **Step 3: Add theme injection to board-scene generation**

In `src/renderer/board-scene.ts`, add imports:

```ts
import { activeTheme, type ThemeDefinition } from "@/theme";
```

Extend `SceneOptions`:

```ts
export interface SceneOptions {
  width: number;
  height: number;
  includeSummary: boolean;
  includeLegend?: boolean;
  title?: string;
  ruleLines?: readonly string[];
  theme?: ThemeDefinition;
}
```

At the start of `createBoardScene`, select the injected theme with a safe default:

```ts
export const createBoardScene = (
  board: GeneratedBoard,
  preset: BoardPreset,
  options: SceneOptions,
): DrawCommand[] => {
  const theme = options.theme ?? activeTheme;
```

Replace scene-only literals with theme values:

```ts
const commands: DrawCommand[] = [
  {
    kind: "clear",
    color: theme.scene.canvas,
    width: options.width,
    height: options.height,
  },
];
```

```ts
commands.push({
  kind: "circle",
  center: at,
  radius: scale * 0.31,
  fill: theme.scene.numberToken,
  stroke: theme.scene.numberToken,
  lineWidth: 0,
  tag: "number-token",
});
commands.push({
  kind: "text",
  at,
  text: String(hex.number),
  color:
    hex.number === 6 || hex.number === 8
      ? theme.scene.highProbabilityNumber
      : theme.scene.numberText,
  fontSize: scale * 0.42,
  weight: "bold",
  align: "center",
  tag: "number-text",
});
```

Use these exact replacements for remaining scene text:

```ts
// resource-legend-label
color: theme.scene.title,

// share-title and all share-metric commands
color: theme.scene.title,

// share-version and share-algorithm
color: theme.scene.mutedText,

// share-rule
color: theme.scene.summaryText,
```

Do not change `RESOURCE_COLORS` or `harborOpeningFill`.

- [ ] **Step 4: Run renderer and DOM-scene regression tests**

Run:

```bash
pnpm vitest run tests/board-scene.test.ts tests/board-dom-model.test.ts
```

Expected: PASS. The DOM scene continues to preserve command colors and reveal timing.

- [ ] **Step 5: Commit themed scene generation**

```bash
git add src/renderer/board-scene.ts tests/board-scene.test.ts
git commit -m "feat: apply theme to board scenes"
```

### Task 3: Wire the active theme through the page, rules, and platform config

**Files:**
- Modify: `src/pages/index/index.tsx`
- Modify: `src/components/RulePanel/index.tsx`
- Modify: `src/app.config.ts`
- Modify: `tests/page-canvas-structure.test.ts`
- Modify: `tests/rule-panel-structure.test.ts`
- Create: `tests/app-theme-structure.test.ts`

- [ ] **Step 1: Add failing page and rule-panel structure assertions**

Append to the `uses DOM for the visible map and keeps Canvas only for sharing` test in `tests/page-canvas-structure.test.ts`:

```ts
expect(pageSource).toContain(
  'import { activeTheme, themeCssVariables } from "@/theme"',
);
expect(pageSource).toContain('style={themeCssVariables(activeTheme)}');
expect(pageSource.match(/theme: activeTheme/g)).toHaveLength(2);
expect(pageSource).toContain('theme={activeTheme}');
```

Append a new test in `tests/rule-panel-structure.test.ts`:

```ts
it("uses the injected theme for both rule switches", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/RulePanel/index.tsx"),
    "utf8",
  );

  expect(source).toContain("theme?: ThemeDefinition");
  expect(source).toContain("theme = activeTheme");
  expect(source.match(/color=\{theme\.ui\.primary\}/g)).toHaveLength(2);
  expect(source).not.toContain('#d98b16');
});
```

Create `tests/app-theme-structure.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("app theme structure", () => {
  it("drives platform colors from the active registered theme", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app.config.ts"),
      "utf8",
    );

    expect(source).toContain('import { activeTheme } from "./theme"');
    expect(source).toContain(
      "navigationBarBackgroundColor: activeTheme.platform.navigationBarBackground",
    );
    expect(source).toContain(
      "navigationBarTextStyle: activeTheme.platform.navigationBarTextStyle",
    );
    expect(source).toContain(
      "backgroundColor: activeTheme.ui.page",
    );
    expect(source).not.toContain("#f5f1e8");
  });
});
```

- [ ] **Step 2: Run the structure tests and verify they fail**

Run:

```bash
pnpm vitest run tests/page-canvas-structure.test.ts tests/rule-panel-structure.test.ts tests/app-theme-structure.test.ts
```

Expected: FAIL because no component or platform config consumes the theme yet.

- [ ] **Step 3: Install the active theme on the page**

In `src/pages/index/index.tsx`, add:

```ts
import { activeTheme, themeCssVariables } from "@/theme";
```

Pass the active theme to both board scenes:

```ts
const commands = visibleBoard
  ? createBoardScene(visibleBoard, displayPreset, {
      ...pageRenderSize,
      includeSummary: false,
      includeLegend: true,
      theme: activeTheme,
    })
  : [];
```

```ts
createBoardScene(visibleBoard, displayPreset, {
  ...shareRenderSize,
  includeSummary: true,
  ruleLines: enabledRuleLines(
    state.appliedRules,
    visibleBoard.version,
  ),
  theme: activeTheme,
})
```

Install variables on the page root and pass the theme to the rule panel:

```tsx
<View className="page" style={themeCssVariables(activeTheme)}>
```

```tsx
<RulePanel
  version={state.version}
  rules={state.draftRules}
  disabled={busy}
  open={rulesOpen}
  theme={activeTheme}
  onClose={() => setRulesOpen(false)}
  onChange={changeDraftRules}
/>
```

- [ ] **Step 4: Make RulePanel consume a replaceable theme**

In `src/components/RulePanel/index.tsx`, add:

```ts
import { activeTheme, type ThemeDefinition } from "@/theme";
```

Extend props and provide a default for isolated callers:

```ts
interface RulePanelProps {
  version: BoardVersion;
  rules: GeneratorRules;
  disabled: boolean;
  open: boolean;
  theme?: ThemeDefinition;
  onClose(): void;
  onChange(rules: GeneratorRules): void;
}
```

```ts
export function RulePanel({
  version,
  rules,
  disabled,
  open,
  theme = activeTheme,
  onClose,
  onChange,
}: RulePanelProps) {
```

Replace both hard-coded switch colors:

```tsx
color={theme.ui.primary}
```

- [ ] **Step 5: Drive app platform colors from the theme registry**

Replace `src/app.config.ts` with:

```ts
import { activeTheme } from "./theme";

export default defineAppConfig({
  pages: ["pages/index/index"],
  window: {
    navigationBarTitleText: "卡坦岛地图生成器",
    navigationBarBackgroundColor:
      activeTheme.platform.navigationBarBackground,
    navigationBarTextStyle: activeTheme.platform.navigationBarTextStyle,
    backgroundColor: activeTheme.ui.page,
  },
});
```

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```bash
pnpm vitest run tests/page-canvas-structure.test.ts tests/rule-panel-structure.test.ts tests/app-theme-structure.test.ts
pnpm typecheck
```

Expected: PASS. If Taro's config type rejects the inferred literal, keep `navigationBarTextStyle` typed as `"black" | "white"` in `ThemeDefinition`; do not cast the config to `any`.

- [ ] **Step 7: Commit theme integration**

```bash
git add src/pages/index/index.tsx src/components/RulePanel/index.tsx src/app.config.ts tests/page-canvas-structure.test.ts tests/rule-panel-structure.test.ts tests/app-theme-structure.test.ts
git commit -m "feat: wire active theme through app UI"
```

### Task 4: Apply the flat Stone Blue component styles

**Files:**
- Modify: `src/pages/index/index.scss`
- Modify: `src/components/RulePanel/index.scss`
- Modify: `src/components/MetricSummary/index.scss`
- Modify: `src/app.scss`
- Create: `tests/theme-style-structure.test.ts`

- [ ] **Step 1: Add the failing flat-style regression test**

Create `tests/theme-style-structure.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("Stone Blue flat styles", () => {
  it("uses semantic CSS variables without old orange or paper colors", () => {
    const styles = [
      read("src/pages/index/index.scss"),
      read("src/components/RulePanel/index.scss"),
      read("src/components/MetricSummary/index.scss"),
    ].join("\n");

    expect(styles).toContain("var(--theme-page)");
    expect(styles).toContain("var(--theme-surface)");
    expect(styles).toContain("var(--theme-primary)");
    expect(styles).toContain("var(--theme-border)");
    expect(styles).not.toContain("#d98b16");
    expect(styles).not.toContain("#f5f1e8");
    expect(styles).not.toContain("#fffdf8");
  });

  it("uses borders and flat surfaces instead of card shadows", () => {
    const styles = [
      read("src/pages/index/index.scss"),
      read("src/components/RulePanel/index.scss"),
      read("src/components/MetricSummary/index.scss"),
    ].join("\n");

    expect(styles).not.toContain("box-shadow");
    expect(styles).toContain("border: 2rpx solid var(--theme-border)");
  });
});
```

- [ ] **Step 2: Run the style test and verify it fails**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts
```

Expected: FAIL because the old paper/orange colors and shadows still exist.

- [ ] **Step 3: Replace the page styles with flat semantic styles**

Replace `src/pages/index/index.scss` with:

```scss
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: var(--theme-page);
  color: var(--theme-text);
}

.top-controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 20rpx;
}

.player-picker {
  min-height: 76rpx;
  padding: 0 24rpx;
  border: 2rpx solid var(--theme-border);
  border-radius: 18rpx;
  background: var(--theme-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.player-picker__label { color: var(--theme-muted); }
.player-picker__value { color: var(--theme-text); font-weight: 800; }

.settings-button {
  min-width: 168rpx;
  min-height: 76rpx;
  padding: 0 24rpx;
  border-radius: 18rpx;
  background: var(--theme-text);
  color: var(--theme-on-primary);
  font-weight: 800;
}

.settings-button::after,
.action::after { border: 0; }

.map-card {
  position: relative;
  overflow: hidden;
  border: 2rpx solid var(--theme-border);
  border-radius: 22rpx;
  background: var(--theme-surface);
}

.actions {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
}

.action {
  border-radius: 16rpx;
  font-weight: 700;
  flex: 1;
}

.action--primary {
  background: var(--theme-primary);
  color: var(--theme-on-primary);
}

.action--secondary {
  border: 2rpx solid var(--theme-primary);
  color: var(--theme-text);
  background: transparent;
}

.settings-button[disabled],
.action[disabled],
.player-picker[disabled] { opacity: .48; }

.dirty-note {
  display: block;
  margin-bottom: 12rpx;
  color: var(--theme-primary);
}

.error-card {
  display: grid;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  border: 2rpx solid var(--theme-danger-text);
  border-radius: 16rpx;
  background: var(--theme-danger-surface);
  color: var(--theme-danger-text);
}

.algorithm-note {
  display: block;
  margin-top: 24rpx;
  color: var(--theme-muted);
  font-size: 24rpx;
  text-align: center;
}
```

- [ ] **Step 4: Replace the rule panel styles**

Replace `src/components/RulePanel/index.scss` with:

```scss
.rule-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  background: var(--theme-overlay);
}

.rule-panel {
  width: 100%;
  max-height: 82vh;
  border-radius: 28rpx 28rpx 0 0;
  background: var(--theme-surface);
  overflow: auto;
  padding-bottom: calc(18rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
}

.rule-panel__header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  background: var(--theme-surface);
  color: var(--theme-text);
  font-weight: 700;
  border-bottom: 2rpx solid var(--theme-border);
}

.rule-panel__close {
  width: 56rpx;
  height: 56rpx;
  padding: 0;
  border: 2rpx solid var(--theme-border);
  border-radius: 14rpx;
  background: var(--theme-page);
  color: var(--theme-text);
  font-size: 30rpx;
  line-height: 52rpx;
  margin: 0;
  text-align: center;
  box-sizing: border-box;
}

.rule-panel__body { padding: 12rpx 24rpx 36rpx; }

.rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 72rpx;
  border-bottom: 2rpx solid var(--theme-border);
  color: var(--theme-text);
}

.rule-row--limit button {
  width: 56rpx;
  min-width: 56rpx;
  padding: 0;
  border: 2rpx solid var(--theme-border);
  border-radius: 12rpx;
  background: var(--theme-page);
  color: var(--theme-text);
}

.rule-row--limit button::after { border: 0; }

.rule-panel__note {
  display: block;
  margin-top: 18rpx;
  color: var(--theme-muted);
  font-size: 24rpx;
  line-height: 1.5;
}
```

- [ ] **Step 5: Replace summary and global fallback styles**

Replace `src/components/MetricSummary/index.scss` with:

```scss
.metric-summary {
  display: grid;
  gap: 10rpx;
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid var(--theme-border);
  border-radius: 18rpx;
  background: var(--theme-surface);
  color: var(--theme-text);
}
```

Replace `src/app.scss` with the pre-mount fallback:

```scss
page {
  min-height: 100%;
  background: #DDE5EA;
  color: #3E5664;
}
```

These two global literals are intentional platform-loading fallbacks documented in the design; component styles remain theme-driven.

- [ ] **Step 6: Run style, structure, and type checks**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts tests/page-canvas-structure.test.ts tests/rule-panel-structure.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the flat component style**

```bash
git add src/pages/index/index.scss src/components/RulePanel/index.scss src/components/MetricSummary/index.scss src/app.scss tests/theme-style-structure.test.ts
git commit -m "style: apply flat Stone Blue theme"
```

### Task 5: Cross-platform regression and visual verification

**Files:**
- No file changes expected; any discovered regression returns to the owning task above before this verification task is repeated.

- [ ] **Step 1: Run the complete unit suite**

Run:

```bash
pnpm test
```

Expected: all Vitest files and tests PASS; no existing generation, sharing, storage, or reveal tests regress.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
pnpm typecheck
```

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 3: Build H5**

Run:

```bash
pnpm build:h5 -- --no-check
```

Expected: exit code 0 and H5 output generated under `dist/`.

- [ ] **Step 4: Build WeChat Mini Program**

Run:

```bash
pnpm build:weapp -- --no-check
```

Expected: exit code 0 and WeChat Mini Program output generated under `dist/`.

- [ ] **Step 5: Run the H5 app for visual inspection**

Run:

```bash
pnpm dev:h5 -- --no-check
```

Open the local H5 URL in the in-app browser and verify:

1. The page, picker, buttons, map surface, metrics, and algorithm note use Stone Blue semantic colors.
2. No old orange controls or paper-colored cards remain.
3. Cards use borders and flat surfaces without visible shadows.
4. Opening the rules drawer shows the themed overlay, surface, separators, close button, and switches.
5. Both 2–4 and 5–6 player maps retain the original wood, wool, grain, brick, ore, desert, and sea colors.
6. Regeneration still uses native loading and the center-out reveal animation.
7. The exported/previewed share image uses the Stone Blue background and text while retaining resource colors.

- [ ] **Step 6: Check the final diff and repository state**

Run:

```bash
git diff --check
git status --short
git log -5 --oneline
```

Expected: `git diff --check` reports no errors. Only intentional pre-existing untracked files such as `.idea/.name` and `.superpowers/` may remain; product and test changes are committed in the task commits above.
