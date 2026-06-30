import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('BoardDom structure', () => {
  it('renders scene layers with Taro DOM nodes and reveal delays', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/BoardDom/index.tsx'), 'utf8')

    expect(source).toContain("import { Text, View } from '@tarojs/components'")
    expect(source).toContain('createBoardDomScene(')
    expect(source).toContain("'--board-reveal-delay'")
    expect(source).toContain("className='board-dom'")
    expect(source).not.toContain('Canvas')
  })

  it('defines separate tile expansion and attached-detail reveal animations', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/BoardDom/index.scss'), 'utf8')

    expect(source).toContain('@keyframes board-hex-reveal')
    expect(source).toContain('@keyframes board-detail-reveal')
    expect(source).toContain('var(--board-reveal-delay)')
    expect(source).toContain('transform: scale(.08) rotate(-8deg)')
  })
})
