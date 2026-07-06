# Desert Yellow Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the original warm visual style as a complete `desertYellow` theme, make it the default, and retain the current `stoneBlue` theme without changing resource tile colors.

**Architecture:** Extend the typed theme contract with semantic appearance tokens and an independent share-algorithm text color. Convert all theme values to root CSS variables so components remain theme-ID agnostic, while board scenes continue receiving the same theme object and `RESOURCE_COLORS` remains external.

**Tech Stack:** Taro 4, React 18, TypeScript 5.9, Sass, Vitest, Taro Canvas 2D

---

## File structure

- Create `src/theme/desert-yellow.ts`: complete Desert Yellow color, appearance, scene, and platform values.
- Modify `src/theme/types.ts`: add `ThemeAppearance` and `scene.algorithmText`.
- Modify `src/theme/stone-blue.ts`: make Stone Blue satisfy the expanded contract without changing its current appearance.
- Modify `src/theme/registry.ts`: register both themes and select Desert Yellow.
- Modify `src/theme/css-variables.ts`: expose appearance values as typed CSS custom properties.
- Modify `src/theme/index.ts`: export Desert Yellow and the appearance type.
- Modify `src/renderer/board-scene.ts`: use the dedicated algorithm text color.
- Modify `src/pages/index/index.scss`: consume appearance variables for picker, settings, map, and actions.
- Modify `src/components/RulePanel/index.scss`: consume panel, close, and step-button appearance variables.
- Modify `src/components/MetricSummary/index.scss`: consume summary appearance variables.
- Modify `src/app.scss`: use Desert Yellow as the pre-mount fallback.
- Modify `tests/theme.test.ts`: verify both themes, the default, CSS variables, and resource isolation.
- Modify `tests/board-scene.test.ts`: verify the independent algorithm color and unchanged resource commands.
- Modify `tests/theme-style-structure.test.ts`: verify semantic appearance variables and Desert Yellow fallback.

### Task 1: Expand the typed theme registry

**Files:**
- Create: `src/theme/desert-yellow.ts`
- Modify: `src/theme/types.ts`
- Modify: `src/theme/stone-blue.ts`
- Modify: `src/theme/registry.ts`
- Modify: `src/theme/css-variables.ts`
- Modify: `src/theme/index.ts`
- Test: `tests/theme.test.ts`

- [ ] **Step 1: Write failing registry and CSS-variable tests**

Update imports in `tests/theme.test.ts` to include `desertYellow`, then define expected appearance values and assert the new default:

```ts
import {
  ACTIVE_THEME_ID,
  activeTheme,
  desertYellow,
  stoneBlue,
  themeCssVariables,
  themeRegistry,
} from '@/theme'

it('registers both themes and selects Desert Yellow', () => {
  expect(themeRegistry.stoneBlue).toBe(stoneBlue)
  expect(themeRegistry.desertYellow).toBe(desertYellow)
  expect(ACTIVE_THEME_ID).toBe('desertYellow')
  expect(activeTheme).toBe(desertYellow)
})

it('restores the complete Desert Yellow theme', () => {
  expect(desertYellow).toEqual({
    id: 'desertYellow',
    name: '沙漠黄',
    ui: {
      page: '#F5F1E8',
      surface: '#FFFDF8',
      primary: '#D98B16',
      text: '#29333A',
      muted: '#73808A',
      border: '#EEE7DA',
      overlay: 'rgba(41, 51, 58, 0.32)',
      dangerSurface: '#FFF0EB',
      dangerText: '#8A3B2F',
      onPrimary: '#FFFFFF',
    },
    appearance: {
      pickerRadius: '24rpx',
      pickerBorder: '0 solid transparent',
      pickerShadow: '0 8rpx 22rpx rgba(41, 51, 58, 0.06)',
      settingsRadius: '24rpx',
      settingsBorder: '0 solid transparent',
      mapRadius: '28rpx',
      mapBorder: '0 solid transparent',
      mapShadow: '0 12rpx 30rpx rgba(41, 51, 58, 0.08)',
      actionRadius: '14rpx',
      primaryActionBorder: '0 solid transparent',
      secondaryActionBorder: '2rpx solid #D98B16',
      secondaryActionText: '#D98B16',
      errorBorder: '0 solid transparent',
      panelRadius: '32rpx 32rpx 0 0',
      panelBorder: '0 solid transparent',
      dividerBorder: '1rpx solid #EEE7DA',
      closeRadius: '999rpx',
      closeBorder: '0 solid transparent',
      closeBackground: '#FFF8EA',
      closeText: '#D98B16',
      closeLineHeight: '56rpx',
      stepRadius: '12rpx',
      stepBorder: '1rpx solid #EEE7DA',
      stepBackground: '#FFF8EA',
      summaryRadius: '20rpx',
      summaryBorder: '0 solid transparent',
      summaryText: '#52616B',
    },
    scene: {
      canvas: '#F7F4EC',
      numberToken: '#FFF7DD',
      numberText: '#24313A',
      highProbabilityNumber: '#C83A2F',
      title: '#29333A',
      mutedText: '#73808A',
      summaryText: '#52616B',
      algorithmText: '#8A959C',
    },
    platform: {
      navigationBarBackground: '#F5F1E8',
      navigationBarTextStyle: 'black',
    },
  })
})
```

Extend `expectedStoneBlue` with this appearance object and `scene.algorithmText`:

```ts
appearance: {
  pickerRadius: '18rpx',
  pickerBorder: '2rpx solid #B9C8CF',
  pickerShadow: 'none',
  settingsRadius: '18rpx',
  settingsBorder: '2rpx solid #3E5664',
  mapRadius: '22rpx',
  mapBorder: '2rpx solid #B9C8CF',
  mapShadow: 'none',
  actionRadius: '16rpx',
  primaryActionBorder: '2rpx solid #647D8C',
  secondaryActionBorder: '2rpx solid #647D8C',
  secondaryActionText: '#3E5664',
  errorBorder: '2rpx solid #B9C8CF',
  panelRadius: '28rpx 28rpx 0 0',
  panelBorder: '2rpx solid #B9C8CF',
  dividerBorder: '2rpx solid #B9C8CF',
  closeRadius: '14rpx',
  closeBorder: '2rpx solid #B9C8CF',
  closeBackground: '#DDE5EA',
  closeText: '#3E5664',
  closeLineHeight: '52rpx',
  stepRadius: '12rpx',
  stepBorder: '2rpx solid #B9C8CF',
  stepBackground: '#DDE5EA',
  summaryRadius: '18rpx',
  summaryBorder: '2rpx solid #B9C8CF',
  summaryText: '#3E5664',
},
// in scene
algorithmText: '#71838D',
```

Assert `themeCssVariables(desertYellow)` contains every new appearance variable, including:

```ts
expect(themeCssVariables(desertYellow)).toMatchObject({
  '--theme-picker-radius': '24rpx',
  '--theme-picker-border': '0 solid transparent',
  '--theme-picker-shadow': '0 8rpx 22rpx rgba(41, 51, 58, 0.06)',
  '--theme-settings-radius': '24rpx',
  '--theme-settings-border': '0 solid transparent',
  '--theme-map-radius': '28rpx',
  '--theme-map-border': '0 solid transparent',
  '--theme-map-shadow': '0 12rpx 30rpx rgba(41, 51, 58, 0.08)',
  '--theme-action-radius': '14rpx',
  '--theme-primary-action-border': '0 solid transparent',
  '--theme-secondary-action-border': '2rpx solid #D98B16',
  '--theme-secondary-action-text': '#D98B16',
  '--theme-error-border': '0 solid transparent',
  '--theme-panel-radius': '32rpx 32rpx 0 0',
  '--theme-panel-border': '0 solid transparent',
  '--theme-divider-border': '1rpx solid #EEE7DA',
  '--theme-close-radius': '999rpx',
  '--theme-close-border': '0 solid transparent',
  '--theme-close-background': '#FFF8EA',
  '--theme-close-text': '#D98B16',
  '--theme-close-line-height': '56rpx',
  '--theme-step-radius': '12rpx',
  '--theme-step-border': '1rpx solid #EEE7DA',
  '--theme-step-background': '#FFF8EA',
  '--theme-summary-radius': '20rpx',
  '--theme-summary-border': '0 solid transparent',
  '--theme-summary-text': '#52616B',
})
```

Extend the resource-isolation test with:

```ts
expect(desertYellow).not.toHaveProperty('resourceColors')
```

- [ ] **Step 2: Run the focused test and verify the contract failures**

Run:

```bash
pnpm vitest run tests/theme.test.ts
```

Expected: FAIL because `desertYellow`, `appearance`, `algorithmText`, and the new CSS variables do not exist.

- [ ] **Step 3: Add the expanded contract**

Add to `src/theme/types.ts`:

```ts
export interface ThemeAppearance {
  pickerRadius: string
  pickerBorder: string
  pickerShadow: string
  settingsRadius: string
  mapRadius: string
  mapBorder: string
  mapShadow: string
  actionRadius: string
  panelRadius: string
  panelBorder: string
  closeRadius: string
  closeBorder: string
  closeBackground: string
  closeText: string
  stepRadius: string
  stepBorder: string
  stepBackground: string
  summaryRadius: string
  summaryBorder: string
}
```

Add `appearance: ThemeAppearance` to `ThemeDefinition` after `ui`, and add `algorithmText: string` to `scene`.

- [ ] **Step 4: Implement both complete themes**

Create `src/theme/desert-yellow.ts` using the exact object asserted in Step 1 and:

```ts
import type { ThemeDefinition } from './types'

export const desertYellow = {
  id: 'desertYellow',
  name: '沙漠黄',
  ui: {
    page: '#F5F1E8',
    surface: '#FFFDF8',
    primary: '#D98B16',
    text: '#29333A',
    muted: '#73808A',
    border: '#EEE7DA',
    overlay: 'rgba(41, 51, 58, 0.32)',
    dangerSurface: '#FFF0EB',
    dangerText: '#8A3B2F',
    onPrimary: '#FFFFFF',
  },
  appearance: {
    pickerRadius: '24rpx',
    pickerBorder: '0 solid transparent',
    pickerShadow: '0 8rpx 22rpx rgba(41, 51, 58, 0.06)',
    settingsRadius: '24rpx',
    settingsBorder: '0 solid transparent',
    mapRadius: '28rpx',
    mapBorder: '0 solid transparent',
    mapShadow: '0 12rpx 30rpx rgba(41, 51, 58, 0.08)',
    actionRadius: '14rpx',
    primaryActionBorder: '0 solid transparent',
    secondaryActionBorder: '2rpx solid #D98B16',
    secondaryActionText: '#D98B16',
    errorBorder: '0 solid transparent',
    panelRadius: '32rpx 32rpx 0 0',
    panelBorder: '0 solid transparent',
    dividerBorder: '1rpx solid #EEE7DA',
    closeRadius: '999rpx',
    closeBorder: '0 solid transparent',
    closeBackground: '#FFF8EA',
    closeText: '#D98B16',
    closeLineHeight: '56rpx',
    stepRadius: '12rpx',
    stepBorder: '1rpx solid #EEE7DA',
    stepBackground: '#FFF8EA',
    summaryRadius: '20rpx',
    summaryBorder: '0 solid transparent',
    summaryText: '#52616B',
  },
  scene: {
    canvas: '#F7F4EC',
    numberToken: '#FFF7DD',
    numberText: '#24313A',
    highProbabilityNumber: '#C83A2F',
    title: '#29333A',
    mutedText: '#73808A',
    summaryText: '#52616B',
    algorithmText: '#8A959C',
  },
  platform: {
    navigationBarBackground: '#F5F1E8',
    navigationBarTextStyle: 'black',
  },
} as const satisfies ThemeDefinition
```

Add this `appearance` section after `ui` in `src/theme/stone-blue.ts`:

```ts
appearance: {
  pickerRadius: '18rpx',
  pickerBorder: '2rpx solid #B9C8CF',
  pickerShadow: 'none',
  settingsRadius: '18rpx',
  settingsBorder: '2rpx solid #3E5664',
  mapRadius: '22rpx',
  mapBorder: '2rpx solid #B9C8CF',
  mapShadow: 'none',
  actionRadius: '16rpx',
  primaryActionBorder: '2rpx solid #647D8C',
  secondaryActionBorder: '2rpx solid #647D8C',
  secondaryActionText: '#3E5664',
  errorBorder: '2rpx solid #B9C8CF',
  panelRadius: '28rpx 28rpx 0 0',
  panelBorder: '2rpx solid #B9C8CF',
  dividerBorder: '2rpx solid #B9C8CF',
  closeRadius: '14rpx',
  closeBorder: '2rpx solid #B9C8CF',
  closeBackground: '#DDE5EA',
  closeText: '#3E5664',
  closeLineHeight: '52rpx',
  stepRadius: '12rpx',
  stepBorder: '2rpx solid #B9C8CF',
  stepBackground: '#DDE5EA',
  summaryRadius: '18rpx',
  summaryBorder: '2rpx solid #B9C8CF',
  summaryText: '#3E5664',
},
```

Add `algorithmText: '#71838D'` after `summaryText` in `stoneBlue.scene`.

- [ ] **Step 5: Register and export Desert Yellow**

Update `src/theme/registry.ts`:

```ts
import { desertYellow } from './desert-yellow'
import { stoneBlue } from './stone-blue'
import type { ThemeDefinition } from './types'

export const themeRegistry = {
  stoneBlue,
  desertYellow,
} as const satisfies Record<string, ThemeDefinition>

export type ThemeId = keyof typeof themeRegistry
export const ACTIVE_THEME_ID: ThemeId = 'desertYellow'
export const activeTheme = themeRegistry[ACTIVE_THEME_ID]
```

Export `desertYellow` and `ThemeAppearance` from `src/theme/index.ts`.

- [ ] **Step 6: Map every appearance token to CSS variables**

Extend `ThemeCssVariableName` in `src/theme/css-variables.ts` with every appearance name asserted in Step 1, then add this complete appearance mapping to the object returned by `themeCssVariables`:

```ts
'--theme-picker-radius': theme.appearance.pickerRadius,
'--theme-picker-border': theme.appearance.pickerBorder,
'--theme-picker-shadow': theme.appearance.pickerShadow,
'--theme-settings-radius': theme.appearance.settingsRadius,
'--theme-settings-border': theme.appearance.settingsBorder,
'--theme-map-radius': theme.appearance.mapRadius,
'--theme-map-border': theme.appearance.mapBorder,
'--theme-map-shadow': theme.appearance.mapShadow,
'--theme-action-radius': theme.appearance.actionRadius,
'--theme-primary-action-border': theme.appearance.primaryActionBorder,
'--theme-secondary-action-border': theme.appearance.secondaryActionBorder,
'--theme-secondary-action-text': theme.appearance.secondaryActionText,
'--theme-error-border': theme.appearance.errorBorder,
'--theme-panel-radius': theme.appearance.panelRadius,
'--theme-panel-border': theme.appearance.panelBorder,
'--theme-divider-border': theme.appearance.dividerBorder,
'--theme-close-radius': theme.appearance.closeRadius,
'--theme-close-border': theme.appearance.closeBorder,
'--theme-close-background': theme.appearance.closeBackground,
'--theme-close-text': theme.appearance.closeText,
'--theme-close-line-height': theme.appearance.closeLineHeight,
'--theme-step-radius': theme.appearance.stepRadius,
'--theme-step-border': theme.appearance.stepBorder,
'--theme-step-background': theme.appearance.stepBackground,
'--theme-summary-radius': theme.appearance.summaryRadius,
'--theme-summary-border': theme.appearance.summaryBorder,
'--theme-summary-text': theme.appearance.summaryText,
```

- [ ] **Step 7: Run the theme tests**

Run:

```bash
pnpm vitest run tests/theme.test.ts
pnpm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 8: Commit the typed theme registry**

```bash
git add src/theme tests/theme.test.ts
git commit -m "feat: register Desert Yellow theme"
```

### Task 2: Preserve exact scene colors

**Files:**
- Modify: `src/renderer/board-scene.ts`
- Modify: `tests/board-scene.test.ts`

- [ ] **Step 1: Write a failing algorithm-color assertion**

Add `algorithmText: '#717273'` to `sentinelTheme.scene`, then change the existing assertion to:

```ts
expect(commands).toContainEqual(
  expect.objectContaining({
    kind: 'text',
    tag: 'share-algorithm',
    color: sentinelTheme.scene.algorithmText,
  }),
)
```

Add a theme-independence check using both registered themes:

```ts
it.each([stoneBlue, desertYellow])(
  'keeps resource commands unchanged for $name',
  (theme) => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, {
      ...getShareCanvasSize(preset),
      includeSummary: true,
      theme,
    })
    const landFills = new Set(
      commands
        .filter(
          (command): command is Extract<DrawCommand, { kind: 'polygon' }> =>
            command.kind === 'polygon' && command.tag === 'land-hex',
        )
        .map((command) => command.fill),
    )
    expect(landFills).toEqual(new Set([
      RESOURCE_COLORS.wood,
      RESOURCE_COLORS.wool,
      RESOURCE_COLORS.grain,
      RESOURCE_COLORS.brick,
      RESOURCE_COLORS.ore,
      RESOURCE_COLORS.desert,
    ]))
  },
)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run tests/board-scene.test.ts
```

Expected: FAIL because `share-algorithm` still uses `mutedText`.

- [ ] **Step 3: Use the dedicated algorithm color**

In `src/renderer/board-scene.ts`, change only the `share-algorithm` command:

```ts
color: theme.scene.algorithmText,
```

- [ ] **Step 4: Run scene and theme tests**

Run:

```bash
pnpm vitest run tests/board-scene.test.ts tests/theme.test.ts
```

Expected: PASS with resource color assertions unchanged.

- [ ] **Step 5: Commit scene support**

```bash
git add src/renderer/board-scene.ts tests/board-scene.test.ts
git commit -m "feat: theme share algorithm text"
```

### Task 3: Apply appearance tokens to component styles

**Files:**
- Modify: `src/pages/index/index.scss`
- Modify: `src/components/RulePanel/index.scss`
- Modify: `src/components/MetricSummary/index.scss`
- Modify: `tests/theme-style-structure.test.ts`

- [ ] **Step 1: Replace Stone-Blue-specific structure assertions with theme-token assertions**

Rename the suite to `themed component styles`. Assert these declarations:

```ts
expectStateRule(pageStyles, String.raw`\.player-picker`, [
  'border: var(--theme-picker-border);',
  'border-radius: var(--theme-picker-radius);',
  'box-shadow: var(--theme-picker-shadow);',
])
expectStateRule(pageStyles, String.raw`\.map-card`, [
  'border: var(--theme-map-border);',
  'border-radius: var(--theme-map-radius);',
  'box-shadow: var(--theme-map-shadow);',
])
expect(pageStyles).toContain('border-radius: var(--theme-action-radius)')
expect(rulePanelStyles).toContain('border-radius: var(--theme-panel-radius)')
expect(rulePanelStyles).toContain('border-top: var(--theme-panel-border)')
expect(rulePanelStyles).toContain('border-bottom: var(--theme-divider-border)')
expect(rulePanelStyles).toContain('border-radius: var(--theme-close-radius)')
expect(rulePanelStyles).toContain('background: var(--theme-close-background)')
expect(rulePanelStyles).toContain('color: var(--theme-close-text)')
expect(rulePanelStyles).toContain('line-height: var(--theme-close-line-height)')
expect(rulePanelStyles).toContain('border-radius: var(--theme-step-radius)')
expect(metricSummaryStyles).toContain('border-radius: var(--theme-summary-radius)')
expect(metricSummaryStyles).toContain('border: var(--theme-summary-border)')
expect(metricSummaryStyles).toContain('color: var(--theme-summary-text)')
```

Keep the existing checks for explicit disabled modifier classes and the ban on hardcoded colors. Change the visual-effects ban so it allows `box-shadow: var(...)` but still rejects hardcoded shadows:

```ts
expect(source).not.toMatch(
  /#[0-9a-f]{3,8}\b|color-mix\s*\(|box-shadow\s*:\s*(?!var\()|text-shadow\s*:|drop-shadow\s*\(|\bfilter\s*:/i,
)
```

- [ ] **Step 2: Run the structure test and verify it fails**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts
```

Expected: FAIL because component radii, borders, and shadows are still hardcoded.

- [ ] **Step 3: Convert index-page appearance to variables**

In `src/pages/index/index.scss`, make these focused replacements:

```scss
.player-picker {
  border: var(--theme-picker-border);
  border-radius: var(--theme-picker-radius);
  box-shadow: var(--theme-picker-shadow);
}

.settings-button {
  border: var(--theme-settings-border);
  border-radius: var(--theme-settings-radius);
}

.map-card {
  border: var(--theme-map-border);
  border-radius: var(--theme-map-radius);
  box-shadow: var(--theme-map-shadow);
}

.action {
  border-radius: var(--theme-action-radius);
}

.action--primary,
.action--primary:not(.action--disabled),
.action--primary.action--disabled,
.action--primary:not(.action--disabled):active,
.action--primary:not(.action--disabled).button-hover {
  border: var(--theme-primary-action-border);
}

.action--secondary,
.action--secondary:not(.action--disabled),
.action--secondary.action--disabled,
.action--secondary:not(.action--disabled):active,
.action--secondary:not(.action--disabled).button-hover {
  border: var(--theme-secondary-action-border);
  color: var(--theme-secondary-action-text);
}

.error-card {
  border: var(--theme-error-border);
}
```

Do not change the explicit enabled, disabled, active, or hover color rules.

- [ ] **Step 4: Convert rule-panel appearance to variables**

In `src/components/RulePanel/index.scss`:

```scss
.rule-panel {
  border-top: var(--theme-panel-border);
  border-radius: var(--theme-panel-radius);
}

.rule-panel__close {
  border: var(--theme-close-border);
  border-radius: var(--theme-close-radius);
  background: var(--theme-close-background);
  color: var(--theme-close-text);
  line-height: var(--theme-close-line-height);
}

.rule-step-button,
.rule-step-button:not(.rule-step-button--disabled),
.rule-step-button--disabled,
.rule-step-button:not(.rule-step-button--disabled):active,
.rule-step-button:not(.rule-step-button--disabled).button-hover {
  border: var(--theme-step-border);
  background: var(--theme-step-background);
}

.rule-step-button {
  border-radius: var(--theme-step-radius);
}
```

Use `border-bottom: var(--theme-divider-border)` for both `.rule-panel__header` and `.rule-row`.

Preserve `color: var(--theme-text)` and opacity behavior in each state rule.

- [ ] **Step 5: Convert metric-summary appearance to variables**

In `src/components/MetricSummary/index.scss`:

```scss
border: var(--theme-summary-border);
border-radius: var(--theme-summary-radius);
color: var(--theme-summary-text);
```

- [ ] **Step 6: Run component structure tests**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts tests/page-canvas-structure.test.ts tests/rule-panel-structure.test.ts
```

Expected: PASS, including the explicit H5 button-state protections.

- [ ] **Step 7: Commit component theme appearance**

```bash
git add src/pages/index/index.scss src/components/RulePanel/index.scss src/components/MetricSummary/index.scss tests/theme-style-structure.test.ts
git commit -m "style: apply registered theme appearance"
```

### Task 4: Switch platform fallback to Desert Yellow

**Files:**
- Modify: `src/app.scss`
- Modify: `tests/theme-style-structure.test.ts`
- Verify: `src/app.config.ts`

- [ ] **Step 1: Write the failing Desert Yellow fallback assertion**

Replace the platform fallback test with:

```ts
it('pre-mounts the active Desert Yellow page and text colors', () => {
  const appStyles = readSource('src/app.scss')

  expect(appStyles).toMatch(/page\s*,\s*html\s*,\s*body\s*,\s*#app\s*\{/)
  expect(appStyles.match(/background(?:-color)?:\s*#F5F1E8;/g)).toHaveLength(2)
  expect(appStyles.match(/(?:^|[;{])\s*color:\s*#29333A;/g)).toHaveLength(2)
  expect(appStyles.toLowerCase()).not.toMatch(/#dde5ea|#3e5664/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts
```

Expected: FAIL because `src/app.scss` still contains Stone Blue fallback values.

- [ ] **Step 3: Update only pre-mount fallback values**

Replace `#DDE5EA` with `#F5F1E8` and `#3E5664` with `#29333A` in `src/app.scss`. Do not duplicate the active theme in `src/app.config.ts`; verify it still reads `activeTheme.platform` and `activeTheme.ui.page`.

- [ ] **Step 4: Run platform integration tests**

Run:

```bash
pnpm vitest run tests/theme-style-structure.test.ts tests/app-theme-structure.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the active platform fallback**

```bash
git add src/app.scss tests/theme-style-structure.test.ts
git commit -m "style: default platform to Desert Yellow"
```

### Task 5: Full regression verification

**Files:**
- Verify only; fix only failures caused by Tasks 1–4.

- [ ] **Step 1: Run formatting and whitespace validation**

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 2: Run the complete test suite**

```bash
pnpm test
```

Expected: all Vitest files and tests PASS.

- [ ] **Step 3: Run TypeScript validation**

```bash
pnpm run typecheck
```

Expected: exit code 0 with no diagnostics.

- [ ] **Step 4: Build H5 and WeChat Mini Program targets**

```bash
pnpm run build:h5
pnpm run build:weapp
```

Expected: both builds finish successfully. Existing Sass legacy-JS and bundle-size warnings may remain, but no new errors are allowed.

- [ ] **Step 5: Inspect the final diff and resource-color invariant**

```bash
git diff --stat HEAD~4..HEAD
git diff HEAD~4..HEAD -- src/renderer/board-scene.ts
```

Expected: the renderer diff changes only the share-algorithm semantic color; `RESOURCE_COLORS` and `harborOpeningFill` are byte-for-byte unchanged.

- [ ] **Step 6: Commit any verification-only corrections**

If Tasks 1–4 required a small correction during full validation, stage only those correction files and commit:

```bash
git commit -m "fix: complete Desert Yellow theme validation"
```

If no corrections were required, do not create an empty commit.
