import { describe, expect, it } from 'vitest'
import type { BoardMetrics, BoardVersion, GeneratedBoard } from '@/domain/board'
import { BOARD_PRESETS } from '@/presets/board-presets'
import { createBoardScene, getPageCanvasSize, getShareCanvasSize, RESOURCE_COLORS } from '@/renderer/board-scene'
import { toDisplayCanvasSize } from '@/shared/units'
import type { DrawCommand } from '@/renderer/commands'
import { activeTheme, stoneBlue, type ThemeDefinition } from '@/theme'

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
const sentinelTheme: ThemeDefinition = {
  ...stoneBlue,
  id: 'sentinel',
  name: 'Sentinel',
  scene: {
    canvas: '#010203',
    numberToken: '#111213',
    numberText: '#212223',
    highProbabilityNumber: '#313233',
    title: '#414243',
    mutedText: '#515253',
    summaryText: '#616263',
  },
}
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
      width: 700, height: 700, includeSummary: false, theme: sentinelTheme,
    })
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', text: '6', color: sentinelTheme.scene.highProbabilityNumber }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', text: '8', color: sentinelTheme.scene.highProbabilityNumber }))
  })

  it('uses every injected scene color for board and share UI', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, {
      ...getShareCanvasSize(preset),
      includeSummary: true,
      ruleLines: ['哨兵规则'],
      theme: sentinelTheme,
    })
    const textCommands = commands.filter((command): command is Extract<DrawCommand, { kind: 'text' }> => command.kind === 'text')
    const regularNumberTexts = textCommands.filter((command) => command.tag === 'number-text' && command.text !== '6' && command.text !== '8')
    const legendLabels = textCommands.filter((command) => command.tag === 'resource-legend-label')
    const metrics = textCommands.filter((command) => command.tag === 'share-metric')

    expect(commands).toContainEqual(expect.objectContaining({ kind: 'clear', color: sentinelTheme.scene.canvas }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'circle', tag: 'number-token', fill: sentinelTheme.scene.numberToken, stroke: sentinelTheme.scene.numberToken }))
    expect(regularNumberTexts.length).toBeGreaterThan(0)
    expect(regularNumberTexts.every((command) => command.color === sentinelTheme.scene.numberText)).toBe(true)
    expect(legendLabels).toHaveLength(6)
    expect(legendLabels.every((command) => command.color === sentinelTheme.scene.title)).toBe(true)
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'share-title', color: sentinelTheme.scene.title }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'share-version', color: sentinelTheme.scene.mutedText }))
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'share-rule', color: sentinelTheme.scene.summaryText }))
    expect(metrics).toHaveLength(3)
    expect(metrics.every((command) => command.color === sentinelTheme.scene.title)).toBe(true)
    expect(commands).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'share-algorithm', color: sentinelTheme.scene.mutedText }))
  })

  it('uses the active theme when no scene theme is provided', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, {
      width: 700, height: 700, includeSummary: false,
    })

    expect(commands).toContainEqual(expect.objectContaining({ kind: 'clear', color: activeTheme.scene.canvas }))
  })

  it('keeps all board and legend resource colors outside the injected theme', () => {
    const { board, preset } = generatedFixture('base')
    const commands = createBoardScene(board, preset, {
      ...getShareCanvasSize(preset), includeSummary: true, theme: sentinelTheme,
    })
    const landFills = new Set(commands.filter((command): command is Extract<DrawCommand, { kind: 'polygon' }> => command.kind === 'polygon' && command.tag === 'land-hex').map((command) => command.fill))
    const seaFills = new Set(commands.filter((command): command is Extract<DrawCommand, { kind: 'polygon' }> => command.kind === 'polygon' && command.tag === 'sea-hex').map((command) => command.fill))
    const legendFills = new Set(commands.filter((command): command is Extract<DrawCommand, { kind: 'polygon' }> => command.kind === 'polygon' && command.tag === 'resource-legend-swatch').map((command) => command.fill))
    const landResourceColors = new Set([
      RESOURCE_COLORS.wood,
      RESOURCE_COLORS.wool,
      RESOURCE_COLORS.grain,
      RESOURCE_COLORS.brick,
      RESOURCE_COLORS.ore,
      RESOURCE_COLORS.desert,
    ])

    expect(landFills).toEqual(landResourceColors)
    expect(seaFills).toEqual(new Set([RESOURCE_COLORS.sea]))
    expect(legendFills).toEqual(landResourceColors)
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
