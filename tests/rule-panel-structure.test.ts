import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('rule panel structure', () => {
  it('uses x as the close button label', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/RulePanel/index.tsx'), 'utf8')

    expect(source).toContain('className="rule-panel__close" onClick={onClose}')
    expect(source).toMatch(/rule-panel__close[\s\S]*>\s*x\s*<\/View>/)
    expect(source).not.toContain('>关闭</Button>')
  })

  it('uses the active theme as the optional switch-color theme', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/RulePanel/index.tsx'), 'utf8')
    const switchColors = [...source.matchAll(/<Switch\b(?:(?!\/>)[\s\S])*?\bcolor\s*=\s*\{([^}]*)\}(?:(?!\/>)[\s\S])*?\/>/g)]

    expect(source).toMatch(/\btheme\?\s*:\s*ThemeDefinition\b/)
    expect(source).toMatch(/\btheme\s*=\s*activeTheme\b/)
    expect(switchColors).toHaveLength(2)
    for (const color of switchColors) {
      expect(color[1]?.trim()).toBe('theme.ui.primary')
    }
    expect(source).not.toContain('#d98b16')
  })
})
