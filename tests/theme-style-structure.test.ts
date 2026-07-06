import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8')

const pageStyles = readSource('src/pages/index/index.scss')
const pageSource = readSource('src/pages/index/index.tsx')
const rulePanelStyles = readSource('src/components/RulePanel/index.scss')
const rulePanelSource = readSource('src/components/RulePanel/index.tsx')
const metricSummaryStyles = readSource('src/components/MetricSummary/index.scss')
const componentStyles = [pageStyles, rulePanelStyles, metricSummaryStyles]

function expectStateRule(
  source: string,
  selectorPattern: string,
  declarations: readonly string[],
) {
  const match = source.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, 's'))

  expect(match, `missing state rule: ${selectorPattern}`).not.toBeNull()
  for (const declaration of declarations) {
    expect(match?.[1]).toContain(declaration)
  }
}

describe('themed component styles', () => {
  it('uses theme variables for the index page hierarchy and status colors', () => {
    for (const variable of [
      '--theme-page',
      '--theme-surface',
      '--theme-primary',
      '--theme-text',
      '--theme-muted',
      '--theme-on-primary',
      '--theme-danger-surface',
      '--theme-danger-text',
      '--theme-picker-radius',
      '--theme-picker-border',
      '--theme-picker-shadow',
      '--theme-settings-radius',
      '--theme-settings-border',
      '--theme-map-radius',
      '--theme-map-border',
      '--theme-map-shadow',
      '--theme-action-radius',
      '--theme-primary-action-border',
      '--theme-secondary-action-border',
      '--theme-secondary-action-text',
      '--theme-error-border',
    ]) {
      expect(pageStyles).toContain(`var(${variable})`)
    }
  })

  it('themes the player picker shape and keeps its disabled state visible', () => {
    expect(pageStyles).toMatch(
      /\.player-picker\s*\{[^}]*\bbox-sizing:\s*border-box;/s,
    )
    expectStateRule(pageStyles, String.raw`\.player-picker`, [
      'border: var(--theme-picker-border);',
      'border-radius: var(--theme-picker-radius);',
      'box-shadow: var(--theme-picker-shadow);',
    ])
    expect(pageSource).toMatch(
      /<Picker\s+className=\{\s*busy\s*\?\s*["']player-picker-control player-picker-control--disabled["']\s*:\s*["']player-picker-control["']\s*\}/,
    )
    expect(pageStyles).toMatch(
      /\.player-picker-control--disabled\s+\.player-picker\s*\{\s*opacity:\s*\.48;\s*\}/,
    )
  })

  it('keeps every page button state in the active theme', () => {
    expect(pageSource).toMatch(
      /className=\{\s*busy\s*\?\s*["']settings-button settings-button--disabled["']\s*:\s*["']settings-button["']\s*\}\s*disabled=\{busy\}/,
    )
    expect(pageSource).toMatch(
      /className=\{\s*busy\s*\?\s*["']action action--primary action--disabled["']\s*:\s*["']action action--primary["']\s*\}\s*disabled=\{busy\}/,
    )
    expect(pageSource).toMatch(
      /className=\{\s*!visibleBoard \|\| busy\s*\?\s*["']action action--secondary action--disabled["']\s*:\s*["']action action--secondary["']\s*\}\s*disabled=\{!visibleBoard \|\| busy\}/,
    )

    expectStateRule(pageStyles, String.raw`\.settings-button--disabled`, [
      'background: var(--theme-text);',
      'color: var(--theme-on-primary);',
      'border: var(--theme-settings-border);',
      'opacity: .48;',
    ])
    expectStateRule(pageStyles, String.raw`\.action--primary\.action--disabled`, [
      'background: var(--theme-primary);',
      'color: var(--theme-on-primary);',
      'border: var(--theme-primary-action-border);',
      'opacity: .48;',
    ])
    expectStateRule(pageStyles, String.raw`\.action--secondary\.action--disabled`, [
      'background: transparent;',
      'color: var(--theme-secondary-action-text);',
      'border: var(--theme-secondary-action-border);',
      'opacity: .48;',
    ])

    for (const [selector, enabledDeclarations] of [
      ['settings-button', [
        'background: var(--theme-text);',
        'color: var(--theme-on-primary);',
        'border: var(--theme-settings-border);',
      ]],
      ['action--primary', [
        'background: var(--theme-primary);',
        'color: var(--theme-on-primary);',
        'border: var(--theme-primary-action-border);',
      ]],
      ['action--secondary', [
        'background: transparent;',
        'color: var(--theme-secondary-action-text);',
        'border: var(--theme-secondary-action-border);',
      ]],
    ] as const) {
      const disabledModifier =
        selector === 'settings-button'
          ? 'settings-button--disabled'
          : 'action--disabled'

      expectStateRule(
        pageStyles,
        String.raw`\.${selector}:not\(\.${disabledModifier}\)`,
        [...enabledDeclarations, 'opacity: 1;'],
      )
      expectStateRule(
        pageStyles,
        String.raw`\.${selector}:not\(\.${disabledModifier}\):active\s*,\s*\.${selector}:not\(\.${disabledModifier}\)\.button-hover`,
        enabledDeclarations,
      )
    }

    expect(pageStyles).not.toMatch(/\[disabled\]/)
  })

  it('uses theme variables for the rule panel surfaces and overlay', () => {
    for (const variable of [
      '--theme-overlay',
      '--theme-surface',
      '--theme-text',
      '--theme-muted',
      '--theme-panel-radius',
      '--theme-panel-border',
      '--theme-divider-border',
      '--theme-close-radius',
      '--theme-close-border',
      '--theme-close-background',
      '--theme-close-text',
      '--theme-close-line-height',
      '--theme-step-radius',
      '--theme-step-border',
      '--theme-step-background',
    ]) {
      expect(rulePanelStyles).toContain(`var(${variable})`)
    }
  })

  it('uses themed panel, close-button, and step-button appearance', () => {
    expect(rulePanelStyles).toMatch(
      /\.rule-panel\s*\{[^}]*\bborder-top:\s*var\(--theme-panel-border\);[^}]*\bborder-radius:\s*var\(--theme-panel-radius\);/s,
    )
    expectStateRule(rulePanelStyles, String.raw`\.rule-panel__close`, [
      'border: var(--theme-close-border);',
      'border-radius: var(--theme-close-radius);',
      'background: var(--theme-close-background);',
      'color: var(--theme-close-text);',
      'line-height: var(--theme-close-line-height);',
    ])
    expect(rulePanelStyles).toMatch(
      /\.rule-step-button\s*\{[^}]*\bborder-radius:\s*var\(--theme-step-radius\);/s,
    )
    expect(rulePanelStyles.match(/border-bottom:\s*var\(--theme-divider-border\);/g)).toHaveLength(2)
  })

  it('keeps disabled and pressed step buttons in the active theme', () => {
    const declarations = [
      'background: var(--theme-step-background);',
      'color: var(--theme-text);',
      'border: var(--theme-step-border);',
    ]

    expect(rulePanelSource.match(/className=\{\s*disabled\s*\?\s*["']rule-step-button rule-step-button--disabled["']\s*:\s*["']rule-step-button["']\s*\}/g)).toHaveLength(2)

    expectStateRule(
      rulePanelStyles,
      String.raw`\.rule-step-button--disabled`,
      [...declarations, 'opacity: .48;'],
    )
    expectStateRule(
      rulePanelStyles,
      String.raw`\.rule-step-button:not\(\.rule-step-button--disabled\)`,
      [...declarations, 'opacity: 1;'],
    )
    expectStateRule(
      rulePanelStyles,
      String.raw`\.rule-step-button:not\(\.rule-step-button--disabled\):active\s*,\s*\.rule-step-button:not\(\.rule-step-button--disabled\)\.button-hover`,
      declarations,
    )
    expect(rulePanelStyles).not.toMatch(/\[disabled\]/)
  })

  it('uses the themed metric summary appearance', () => {
    for (const variable of [
      '--theme-surface',
      '--theme-summary-border',
      '--theme-summary-radius',
      '--theme-summary-text',
    ]) {
      expect(metricSummaryStyles).toContain(`var(${variable})`)
    }
  })

  it('keeps component styles free of hardcoded colors and visual effects', () => {
    for (const source of componentStyles) {
      expect(source).not.toMatch(
        /#[0-9a-f]{3,8}\b|color-mix\s*\(|text-shadow\s*:|drop-shadow\s*\(|\bfilter\s*:/i,
      )
      for (const match of source.matchAll(/box-shadow\s*:\s*([^;]+);/gi)) {
        expect(match[1]?.trim()).toMatch(/^var\(--theme-/)
      }
    }
  })
})

describe('platform theme fallback', () => {
  it('pre-mounts the active Desert Yellow page and text colors', () => {
    const appStyles = readSource('src/app.scss')

    expect(appStyles).toMatch(/page\s*,\s*html\s*,\s*body\s*,\s*#app\s*\{/)
    expect(appStyles).toMatch(
      /body\s+\.taro_router\s*>\s*\.taro_page\s*\{[^}]*background-color:\s*#F5F1E8;[^}]*color:\s*#29333A;/s,
    )
    expect(appStyles.match(/background(?:-color)?:\s*#F5F1E8;/g)).toHaveLength(2)
    expect(appStyles.match(/(?:^|[;{])\s*color:\s*#29333A;/g)).toHaveLength(2)
    expect(appStyles.toLowerCase()).not.toMatch(/#dde5ea|#3e5664/)
  })
})
