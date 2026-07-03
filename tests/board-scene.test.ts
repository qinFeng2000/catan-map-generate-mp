import { describe, expect, it } from 'vitest'
import type { BoardMetrics, BoardVersion, GeneratedBoard } from '@/domain/board'
import { BOARD_PRESETS } from '@/presets/board-presets'
import { createBoardScene, getPageCanvasSize, getShareCanvasSize, RESOURCE_COLORS } from '@/renderer/board-scene'
import { toDisplayCanvasSize } from '@/shared/units'
import type { DrawCommand } from '@/renderer/commands'
import { stoneBlue } from '@/theme'

const zeroMetrics: BoardMetrics = {
  sameNumberMinDistance: 0, resourcePipRange: 0, intersectionMaxPips: 0,
  intersectionPipRange: 0, intersectionStdDev: 0, woodBrickSharedPips: 0, normalizedScore: 0,
}
const generatedFixture = (version: BoardVersion) => {
  const preset = BOARD_PRESETS[version]
  let numberIndex = 0
  const board: GeneratedBoard = {
    version, seed: 1, createdAt: 1, metrics: zeroMetrics,
    hexes: preset.landCoords.map((coord, index) => {
      const resource = preset.resourceBag[index]!
      return { id: `${coord.q},${coord.r}`, coord, resource, number: resource === 'desert' ? null : preset.numberBag[numberIndex++]! }
    }),
  }
  return { board, preset }
}
const basePreset = BOARD_PRESETS.base
const hotNumberFixture: GeneratedBoard = (() => {
  const { board } = generatedFixture('base')
  const productive = board.hexes.filter((hex) => hex.resource !== 'desert').map((hex) => ({ ...hex }))
  productive[0]!.number = 6; productive[1]!.number = 8
  return { ...board, hexes: [...productive, ...board.hexes.filter((hex) => hex.resource === 'desert')] }
})()

describe('createBoardScene', () => {
  const commandBounds = (commands: readonly DrawCommand[]) => {
    const points = commands.flatMap((command) => {
      if (command.kind === 'polygon') return [...command.points]
      if (command.kind === 'circle') {
        return [
          { x: command.center.x - command.radius, y: command.center.y - command.radius },
          { x: command.center.x + command.radius, y: command.center.y + command.radius },
        ]
      }
      return []
    })
    return {
      minX: Math.min(...points.map((point) => point.x)),
      maxX: Math.max(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxY: Math.max(...points.map((point) => point.y)),
    }
  }

  it.each(['base', 'extension'] as const)('draws all %s sea tiles and harbor opening triangles', (version) => {
    const { board, preset } = generatedFixture(version)
    const commands = createBoardScene(board, preset, { width: 700, height: 700, includeSummary: false })
    expect(commands.filter((command) => command.tag === 'sea-hex')).toHaveLength(preset.seaCoords.length)
    expect(commands.filter((command) => command.tag === 'harbor-opening')).toHaveLength(preset.harbors.length)
    expect(commands.filter((command) => command.tag === 'harbor-label')).toHaveLength(0)
    expect(commands.filter((command) => command.tag === 'harbor-channel')).toHaveLength(0)
    expect(commands).not.toContainEqual(expect.objectContaining({ kind: 'text', text: '2:1' }))
    expect(commands).not.toContainEqual(expect.objectContaining({ kind: 'text', text: '3:1' }))
  })

  it('fills generic harbors with sand tone and resource harbors with resource colors', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, { width: 700, height: 700, includeSummary: false })
    const openings = commands.filter((command): command is Extract<DrawCommand, { kind: 'polygon' }> => command.tag === 'harbor-opening' && command.kind === 'polygon')
    expect(openings).toContainEqual(expect.objectContaining({ kind: 'polygon', fill: '#E7D9AD' }))
    expect(openings).toContainEqual(expect.objectContaining({ kind: 'polygon', fill: '#3f8f4b' }))
    for (const opening of openings) {
      expect(opening.stroke).toBe(opening.fill)
      expect(opening.lineWidth).toBe(0)
    }
  })

  it('uses the theme high-probability color for 6 and 8', () => {
    const commands = createBoardScene(hotNumberFixture, basePreset, {
      width: 700, height: 700, includeSummary: false, theme: stoneBlue,
    })
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', text: '6', color: stoneBlue.scene.highProbabilityNumber }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', text: '8', color: stoneBlue.scene.highProbabilityNumber }))
  })

  it('uses the injected theme for scene UI colors without changing resource colors', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, {
      ...getShareCanvasSize(preset), includeSummary: true, theme: stoneBlue,
    })

    expect(commands).toContainEqual(expect.objectContaining({ kind: 'clear', color: stoneBlue.scene.canvas }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'circle', tag: 'number-token', fill: stoneBlue.scene.numberToken }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'share-title', color: stoneBlue.scene.title }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'polygon', tag: 'land-hex', fill: RESOURCE_COLORS.wood }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'polygon', tag: 'sea-hex', fill: RESOURCE_COLORS.sea }))
  })

  it('fills the canvas with readable tiles and removes white seams', () => {
    const { board, preset } = generatedFixture('base')
    const design = getPageCanvasSize(preset, 700)
    const commands = createBoardScene(board, preset, { ...design, includeSummary: false })
    const clear = commands.find((command): command is Extract<DrawCommand, { kind: 'clear' }> => command.kind === 'clear')!
    const bounds = commandBounds(commands.filter((command) => command.tag === 'sea-hex' || command.tag === 'land-hex' || command.tag === 'harbor-opening'))
    expect((bounds.maxX - bounds.minX) / clear.width).toBeGreaterThan(0.93)
    for (const command of commands.filter((item): item is Extract<DrawCommand, { kind: 'polygon' }> => item.tag === 'land-hex' && item.kind === 'polygon')) {
      expect(command.stroke).toBe(command.fill)
    }
  })

  it('renders larger borderless number tokens and leaves deserts empty', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, { width: 700, height: 700, includeSummary: false })
    const token = commands.find((command): command is Extract<DrawCommand, { kind: 'circle' }> => command.tag === 'number-token' && command.kind === 'circle')!
    const text = commands.find((command): command is Extract<DrawCommand, { kind: 'text' }> => command.tag === 'number-text' && command.kind === 'text')!
    expect(token.stroke).toBe(token.fill)
    expect(token.lineWidth).toBe(0)
    expect(text.fontSize / token.radius).toBeGreaterThan(1.25)
    expect(commands.filter((command) => command.tag === 'desert-mark')).toHaveLength(0)
  })

  it('draws the resource legend inside the canvas', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, { width: 700, height: 700, includeSummary: false, includeLegend: true })
    expect(commands.filter((command) => command.tag === 'resource-legend-swatch')).toHaveLength(6)
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'resource-legend-label', text: '木材' }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'resource-legend-label', text: '沙漠' }))
    const legendBounds = commandBounds(commands.filter((command) => command.tag === 'resource-legend-swatch'))
    const mapBounds = commandBounds(commands.filter((command) => command.tag === 'sea-hex' || command.tag === 'land-hex' || command.tag === 'harbor-opening'))
    expect(legendBounds.minY).toBeLessThan(mapBounds.minY)
    expect(mapBounds.minY - legendBounds.maxY).toBeGreaterThanOrEqual(18)
  })

  it('allocates a taller canvas for the 5-6 player board', () => {
    const base = getPageCanvasSize(BOARD_PRESETS.base, 686)
    const extension = getPageCanvasSize(BOARD_PRESETS.extension, 686)
    expect(extension.height).toBeGreaterThan(base.height)
  })

  it.each(['base', 'extension'] as const)('uses a portrait share canvas for %s so preview does not crop horizontally', (version) => {
    const size = getShareCanvasSize(BOARD_PRESETS[version])
    expect(size.width).toBe(1200)
    expect(size.height / size.width).toBeGreaterThanOrEqual(1.5)
  })

  it('places share metrics in the right bottom column away from rule text', () => {
    const { board, preset } = generatedFixture('extension')
    const size = getShareCanvasSize(preset)
    const commands = createBoardScene(board, preset, {
      ...size,
      includeSummary: true,
      ruleLines: ['规则一', '规则二', '规则三', '规则四', '规则五', '规则六'],
    })
    const rules = commands.filter((command): command is Extract<DrawCommand, { kind: 'text' }> => command.kind === 'text' && command.tag === 'share-rule')
    const metrics = commands.filter((command): command is Extract<DrawCommand, { kind: 'text' }> => command.kind === 'text' && command.tag === 'share-metric')

    expect(rules.every((rule) => rule.align === 'left' && rule.at.x < size.width / 2)).toBe(true)
    expect(metrics).toHaveLength(3)
    expect(metrics.every((metric) => metric.align === 'right' && metric.at.x > size.width / 2)).toBe(true)
  })

  it('does not throw when board and preset versions mismatch', () => {
    const { board } = generatedFixture('base')
    expect(() => createBoardScene(board, BOARD_PRESETS.extension, { width: 700, height: 900, includeSummary: false })).not.toThrow()
  })

  it.each(['base', 'extension'] as const)('keeps %s geometry inside canvas bounds at phone width', (version) => {
    const { board, preset } = generatedFixture(version)
    const design = getPageCanvasSize(preset, 686)
    const render = toDisplayCanvasSize(design.width, design.height, 375)
    const commands = createBoardScene(board, preset, { ...render, includeSummary: false })
    const clear = commands.find((command): command is Extract<DrawCommand, { kind: 'clear' }> => command.kind === 'clear')!
    const samplePoints = commands.flatMap((command) => {
      if (command.kind === 'polygon') return [...command.points]
      if (command.kind === 'circle') {
        return [
          { x: command.center.x - command.radius, y: command.center.y - command.radius },
          { x: command.center.x + command.radius, y: command.center.y + command.radius },
        ]
      }
      if (command.kind === 'line') return [command.from, command.to]
      if (command.kind === 'text') return [command.at]
      return []
    })
    for (const point of samplePoints) {
      expect(point.x).toBeGreaterThanOrEqual(-2)
      expect(point.x).toBeLessThanOrEqual(clear.width + 2)
      expect(point.y).toBeGreaterThanOrEqual(-2)
      expect(point.y).toBeLessThanOrEqual(clear.height + 2)
    }
  })
})
