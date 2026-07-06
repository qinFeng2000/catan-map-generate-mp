import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const GUARDED_OFFSCREEN_CANVAS_PATTERN =
  /\{visibleBoard\s*&&\s*!rulesOpen\s*&&\s*\(\s*<BoardCanvas\b(?:(?!\/>)[\s\S])*?\boffscreen\b(?:(?!\/>)[\s\S])*?\/>/

function findCreateBoardSceneCalls(source: string): ts.CallExpression[] {
  const sourceFile = ts.createSourceFile(
    'index.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const calls: ts.CallExpression[] = []

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createBoardScene'
    ) {
      calls.push(node)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return calls
}

describe('index page canvas structure', () => {
  it('ignores createBoardScene text inside comments and strings', () => {
    const source = `
      // createBoardScene(commentBoard, commentPreset, { theme: activeTheme })
      const example = "createBoardScene(stringBoard, stringPreset, { theme: activeTheme })"
      createBoardScene(board, preset, { theme: activeTheme })
    `

    expect(findCreateBoardSceneCalls(source)).toHaveLength(1)
  })

  it('does not expose unfinished game mode tabs', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/index/index.tsx'), 'utf8')

    expect(source).not.toContain('GAME_MODE_TABS')
    expect(source).not.toContain('version-tabs')
    expect(source).not.toContain('version-tab')
  })

  it('renders the page canvas without draggable viewport or scaled content layers', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/index/index.tsx'), 'utf8')

    expect(source).not.toContain('BoardViewport')
    expect(source).not.toContain('pageContentSize')
    expect(source).not.toContain('contentViewScale')
    expect(source).not.toContain('MovableArea')
    expect(source).not.toContain('MovableView')
  })

  it('keeps canvas nodes out of the tree while the rule panel is open', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/index/index.tsx'), 'utf8')

    expect(source).toMatch(GUARDED_OFFSCREEN_CANVAS_PATTERN)
  })

  it('requires offscreen on the guarded BoardCanvas tag itself', () => {
    const source = `
      {visibleBoard && !rulesOpen && (
        <BoardCanvas canvasId="share-canvas" />
      )}
      <View offscreen />
    `

    expect(source).not.toMatch(GUARDED_OFFSCREEN_CANVAS_PATTERN)
  })

  it('routes every page generation through the native loading task', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/index/use-board-generator.ts'), 'utf8')

    expect(source).toContain('runPageGeneration(version, rules)')
    expect(source).not.toContain("from '@/generator/generate-board'")
  })

  it('uses DOM for the visible map and keeps Canvas only for sharing', () => {
    const pageSource = readFileSync(resolve(process.cwd(), 'src/pages/index/index.tsx'), 'utf8')
    const styleSource = readFileSync(resolve(process.cwd(), 'src/pages/index/index.scss'), 'utf8')

    expect(pageSource).toMatch(
      /import\s+\{\s*BoardDom\s*\}\s+from\s+["']@\/components\/BoardDom["']/,
    )
    expect(pageSource).toContain('key={`${visibleBoard.version}-${visibleBoard.seed}-${visibleBoard.createdAt}`}')
    expect(pageSource).toMatch(/canvasId\s*=\s*["']share-canvas["']/)
    expect(pageSource).toContain('offscreen')
    expect(pageSource.match(/<BoardCanvas/g)).toHaveLength(1)
    expect(pageSource).not.toMatch(/canvasId\s*=\s*["']board-canvas["']/)
    expect(pageSource).not.toMatch(/className\s*=\s*["']map-loading["']/)
    expect(styleSource).not.toContain('.map-loading')
  })

  it('wires the active theme through the page, board scenes, and rule panel', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/index/index.tsx'), 'utf8')
    const boardSceneCalls = findCreateBoardSceneCalls(source)

    expect(source).toMatch(
      /import\s*\{[^}]*\bactiveTheme\b[^}]*\bthemeCssVariables\b[^}]*\}\s*from\s*["']@\/theme["']|import\s*\{[^}]*\bthemeCssVariables\b[^}]*\bactiveTheme\b[^}]*\}\s*from\s*["']@\/theme["']/,
    )
    expect(source).toMatch(
      /<View\b(?=[^>]*\bclassName\s*=\s*["']page["'])(?=[^>]*\bstyle\s*=\s*\{\s*themeCssVariables\(\s*activeTheme\s*,\s*rpx\s*\)\s*\})[^>]*>/,
    )
    expect(boardSceneCalls).toHaveLength(2)
    for (const call of boardSceneCalls) {
      const options = call.arguments[2]

      expect(options && ts.isObjectLiteralExpression(options)).toBe(true)
      if (!options || !ts.isObjectLiteralExpression(options)) continue

      const themeProperty = options.properties.find(
        (property): property is ts.PropertyAssignment =>
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.name.text === 'theme',
      )
      expect(themeProperty).toBeDefined()
      if (!themeProperty) continue

      expect(ts.isIdentifier(themeProperty.initializer)).toBe(true)
      if (!ts.isIdentifier(themeProperty.initializer)) continue
      expect(themeProperty.initializer.text).toBe('activeTheme')
    }
    expect(source).toMatch(/<RulePanel\b(?:(?!\/>)[\s\S])*?\btheme\s*=\s*\{\s*activeTheme\s*\}(?:(?!\/>)[\s\S])*?\/>/)
  })
})
