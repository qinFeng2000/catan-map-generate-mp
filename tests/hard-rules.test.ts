import { describe, expect, it } from 'vitest'
import { coordKey, type BoardVersion, type LandHex } from '@/domain/board'
import { DEFAULT_RULES } from '@/domain/rules'
import { buildTopology } from '@/geometry/topology'
import { validateHardRules } from '@/generator/hard-rules'
import { placeNumbers } from '@/generator/number-search'
import { mulberry32 } from '@/generator/random'
import { placeResources } from '@/generator/resource-search'
import { BOARD_PRESETS } from '@/presets/board-presets'

const generated = (version: BoardVersion): LandHex[] => {
  const preset = BOARD_PRESETS[version]
  const topology = buildTopology(preset.landCoords)
  const resources = placeResources(preset, DEFAULT_RULES, topology, mulberry32(11), 5_000)
  if (!resources.ok) throw new Error('resource fixture failed')
  const numberSeed = version === 'base' ? 19 : 20
  const numbers = placeNumbers(preset, resources.hexes, DEFAULT_RULES, topology, mulberry32(numberSeed), 50_000)
  if (!numbers.ok) throw new Error('number fixture failed')
  return numbers.hexes.map((hex) => ({ ...hex, coord: { ...hex.coord } }))
}

const rulesForEveryValidator = {
  ...DEFAULT_RULES,
  avoidCoastalDesert: true,
  forbidAdjacentSameNumberGroup: true,
}

describe('validateHardRules', () => {
  it('reports coastal desert', () => {
    const preset = BOARD_PRESETS.base
    const topology = buildTopology(preset.landCoords)
    const board = generated('base')
    const key = [...topology.coastalHexKeys][0]!
    const hex = board.find((item) => coordKey(item.coord) === key)!
    hex.resource = 'desert'; hex.number = null
    expect(validateHardRules(board, preset, rulesForEveryValidator, topology).map((item) => item.rule)).toContain('coastal-desert')
  })

  it('reports a repeated number group on one resource', () => {
    const preset = BOARD_PRESETS.base
    const topology = buildTopology(preset.landCoords)
    const board = generated('base')
    const wood = board.filter((hex) => hex.resource === 'wood')
    wood[0]!.number = 6; wood[1]!.number = 8
    expect(validateHardRules(board, preset, rulesForEveryValidator, topology).map((item) => item.rule)).toContain('resource-number-group')
  })

  it('reports an intersection resource overflow', () => {
    const preset = BOARD_PRESETS.base
    const topology = buildTopology(preset.landCoords)
    const board = generated('base')
    const intersection = topology.intersections.find((item) => item.hexKeys.length === 3)!
    intersection.hexKeys.slice(0, 2).forEach((key) => { board.find((hex) => coordKey(hex.coord) === key)!.resource = 'ore' })
    expect(validateHardRules(board, preset, rulesForEveryValidator, topology).map((item) => item.rule)).toContain('intersection-resource-limit')
  })

  it('reports adjacent equal number groups', () => {
    const preset = BOARD_PRESETS.base
    const topology = buildTopology(preset.landCoords)
    const board = generated('base')
    const [leftKey, neighborKeys] = [...topology.neighbors].find(([, neighbors]) => neighbors.length > 0)!
    board.find((hex) => coordKey(hex.coord) === leftKey)!.number = 6
    board.find((hex) => coordKey(hex.coord) === neighborKeys[0])!.number = 8
    expect(validateHardRules(board, preset, rulesForEveryValidator, topology).map((item) => item.rule)).toContain('adjacent-number-group')
  })

  it('reports a base wood/brick number overlap', () => {
    const preset = BOARD_PRESETS.base
    const topology = buildTopology(preset.landCoords)
    const board = generated('base')
    const wood = board.find((hex) => hex.resource === 'wood')!
    const brick = board.find((hex) => hex.resource === 'brick')!
    wood.number = 3; brick.number = 3
    expect(validateHardRules(board, preset, rulesForEveryValidator, topology).map((item) => item.rule)).toContain('wood-brick-overlap')
  })

  it.each(['base', 'extension'] as const)('accepts a generated default %s board', (version) => {
    const preset = BOARD_PRESETS[version]
    expect(validateHardRules(generated(version), preset, DEFAULT_RULES, buildTopology(preset.landCoords))).toEqual([])
  })
})
