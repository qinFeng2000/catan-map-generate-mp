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
})
