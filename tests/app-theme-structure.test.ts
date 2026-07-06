import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('app theme structure', () => {
  it('uses the active theme for platform chrome colors', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app.config.ts'), 'utf8')

    expect(source).toMatch(
      /import\s*\{[^}]*\bactiveTheme\b[^}]*\}\s*from\s*["']\.\/theme["']/,
    )
    expect(source).toMatch(
      /\bnavigationBarBackgroundColor\s*:\s*activeTheme\.platform\.navigationBarBackground\b/,
    )
    expect(source).toMatch(
      /\bnavigationBarTextStyle\s*:\s*activeTheme\.platform\.navigationBarTextStyle\b/,
    )
    expect(source).toMatch(/\bbackgroundColor\s*:\s*activeTheme\.ui\.page\b/)
    expect(source).not.toContain('#f5f1e8')
  })

  it('keeps the app-config theme import free of Taro runtime dependencies', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/theme/css-variables.ts'),
      'utf8',
    )

    expect(source).not.toMatch(/from\s*['"]@\/shared\/units['"]/)
    expect(source).not.toMatch(/from\s*['"]@tarojs\/taro['"]/)
  })
})
