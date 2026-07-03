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
  declarations: string[],
) {
  const match = source.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, 's'))

  expect(match, `missing state rule: ${selectorPattern}`).not.toBeNull()
  for (const declaration of declarations) {
    expect(match?.[1]).toContain(declaration)
  }
}

describe('Stone Blue component styles', () => {
  it('uses theme variables for the index page hierarchy and status colors', () => {
    for (const variable of [
      '--theme-page',
      '--theme-surface',
      '--theme-primary',
      '--theme-border',
      '--theme-text',
      '--theme-muted',
      '--theme-on-primary',
      '--theme-danger-surface',
      '--theme-danger-text',
    ]) {
      expect(pageStyles).toContain(`var(${variable})`)
    }
    expect(pageStyles).toContain('border: 2rpx solid var(--theme-border)')
  })

  it('keeps the bordered player picker sized and visibly disabled', () => {
    expect(pageStyles).toMatch(
      /\.player-picker\s*\{[^}]*\bbox-sizing:\s*border-box;/s,
    )
    expect(pageSource).toMatch(
      /<Picker\s+className=\{\s*busy\s*\?\s*["']player-picker-control player-picker-control--disabled["']\s*:\s*["']player-picker-control["']\s*\}/,
    )
    expect(pageStyles).toMatch(
      /\.player-picker-control--disabled\s+\.player-picker\s*\{\s*opacity:\s*\.48;\s*\}/,
    )
  })

  it('keeps every page button state in the Stone Blue palette', () => {
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
      'border: 2rpx solid var(--theme-text);',
      'opacity: .48;',
    ])
    expectStateRule(pageStyles, String.raw`\.action--primary\.action--disabled`, [
      'background: var(--theme-primary);',
      'color: var(--theme-on-primary);',
      'border: 2rpx solid var(--theme-primary);',
      'opacity: .48;',
    ])
    expectStateRule(pageStyles, String.raw`\.action--secondary\.action--disabled`, [
      'background: transparent;',
      'color: var(--theme-text);',
      'border: 2rpx solid var(--theme-primary);',
      'opacity: .48;',
    ])

    for (const [selector, background, color, border] of [
      ['settings-button', '--theme-text', '--theme-on-primary', '--theme-text'],
      ['action--primary', '--theme-primary', '--theme-on-primary', '--theme-primary'],
      ['action--secondary', 'transparent', '--theme-text', '--theme-primary'],
    ] as const) {
      expectStateRule(
        pageStyles,
        String.raw`\.${selector}:not\(\.${selector === 'settings-button' ? 'settings-button--disabled' : 'action--disabled'}\):active\s*,\s*\.${selector}:not\(\.${selector === 'settings-button' ? 'settings-button--disabled' : 'action--disabled'}\)\.button-hover`,
        [
          background === 'transparent'
            ? 'background: transparent;'
            : `background: var(${background});`,
          `color: var(${color});`,
          `border: 2rpx solid var(${border});`,
        ],
      )
    }

    expect(pageStyles).not.toMatch(/\[disabled\]/)
  })

  it('uses theme variables for the rule panel surfaces and overlay', () => {
    for (const variable of [
      '--theme-overlay',
      '--theme-surface',
      '--theme-page',
      '--theme-border',
      '--theme-text',
      '--theme-muted',
    ]) {
      expect(rulePanelStyles).toContain(`var(${variable})`)
    }
    expect(rulePanelStyles).toContain('border: 2rpx solid var(--theme-border)')
  })

  it('uses the specified panel and step-button corner radii', () => {
    expect(rulePanelStyles).toMatch(
      /\.rule-panel\s*\{[^}]*\bborder-radius:\s*28rpx 28rpx 0 0;/s,
    )
    expect(rulePanelStyles).toMatch(
      /\.rule-step-button\s*\{[^}]*\bborder-radius:\s*12rpx;/s,
    )
  })

  it('keeps disabled and pressed step buttons in the Stone Blue palette', () => {
    const declarations = [
      'background: var(--theme-page);',
      'color: var(--theme-text);',
      'border: 2rpx solid var(--theme-border);',
    ]

    expect(rulePanelSource.match(/className=\{\s*disabled\s*\?\s*["']rule-step-button rule-step-button--disabled["']\s*:\s*["']rule-step-button["']\s*\}/g)).toHaveLength(2)

    expectStateRule(
      rulePanelStyles,
      String.raw`\.rule-step-button--disabled`,
      [...declarations, 'opacity: .48;'],
    )
    expectStateRule(
      rulePanelStyles,
      String.raw`\.rule-step-button:not\(\.rule-step-button--disabled\):active\s*,\s*\.rule-step-button:not\(\.rule-step-button--disabled\)\.button-hover`,
      declarations,
    )
    expect(rulePanelStyles).not.toMatch(/\[disabled\]/)
  })

  it('uses a bordered theme surface for the metric summary', () => {
    for (const variable of ['--theme-surface', '--theme-border', '--theme-text']) {
      expect(metricSummaryStyles).toContain(`var(${variable})`)
    }
    expect(metricSummaryStyles).toContain(
      'border: 2rpx solid var(--theme-border)',
    )
  })

  it('keeps component styles free of hardcoded colors and visual effects', () => {
    for (const source of componentStyles) {
      expect(source).not.toMatch(
        /#[0-9a-f]{3,8}\b|color-mix\s*\(|(?:box|text)-shadow\s*:|drop-shadow\s*\(|\bfilter\s*:/i,
      )
    }
  })
})

describe('platform theme fallback', () => {
  it('pre-mounts the Stone Blue page and text colors', () => {
    const appStyles = readSource('src/app.scss')

    expect(appStyles).toMatch(/page\s*,\s*html\s*,\s*body\s*,\s*#app\s*\{/)
    expect(appStyles).toMatch(
      /body\s+\.taro_router\s*>\s*\.taro_page\s*\{[^}]*background-color:\s*#DDE5EA;[^}]*color:\s*#3E5664;/s,
    )
    expect(appStyles.match(/background(?:-color)?:\s*#DDE5EA;/g)).toHaveLength(2)
    expect(appStyles.match(/(?:^|[;{])\s*color:\s*#3E5664;/g)).toHaveLength(2)
    expect(appStyles.toLowerCase()).not.toMatch(/#d98b16|#f5f1e8|#fffdf8/)
  })
})
