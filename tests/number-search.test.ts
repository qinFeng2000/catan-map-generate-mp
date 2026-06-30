import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, numberGroup } from '@/domain/rules'
import { buildTopology } from '@/geometry/topology'
import { placeNumbers } from '@/generator/number-search'
import { placeResources } from '@/generator/resource-search'
import { mulberry32 } from '@/generator/random'
import { BOARD_PRESETS } from '@/presets/board-presets'

describe('placeNumbers', () => {
  it.each(['base', 'extension'] as const)('assigns all %s numbers under default rules', (version) => {
    const preset = BOARD_PRESETS[version]
    const topology = buildTopology(preset.landCoords)
    const resources = placeResources(preset, DEFAULT_RULES, topology, mulberry32(11), 5_000)
    expect(resources.ok).toBe(true)
    if (!resources.ok) return
    const numberSeed = version === 'base' ? 19 : 20
    const result = placeNumbers(preset, resources.hexes, DEFAULT_RULES, topology, mulberry32(numberSeed), 50_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.hexes.filter((hex) => hex.number !== null)).toHaveLength(preset.numberBag.length)
  })

  it('uses exactly the two approved 5-6 player exceptions', () => {
    const preset = BOARD_PRESETS.extension
    const topology = buildTopology(preset.landCoords)
    const resources = placeResources(preset, DEFAULT_RULES, topology, mulberry32(11), 5_000)
    if (!resources.ok) throw new Error('resource fixture failed')
    const result = placeNumbers(preset, resources.hexes, DEFAULT_RULES, topology, mulberry32(20), 50_000)
    if (!result.ok) throw new Error('number fixture failed')

    const grouped = new Map<string, string[]>()
    for (const hex of result.hexes) {
      if (hex.resource === 'desert' || hex.number === null) continue
      const values = grouped.get(hex.resource) ?? []
      values.push(numberGroup(hex.number))
      grouped.set(hex.resource, values)
    }
    expect([...grouped.values()].filter((groups) => groups.length !== new Set(groups).size)).toHaveLength(1)

    const wood = new Set(result.hexes.filter((hex) => hex.resource === 'wood').map((hex) => hex.number))
    const brick = new Set(result.hexes.filter((hex) => hex.resource === 'brick').map((hex) => hex.number))
    expect([...wood].filter((number) => brick.has(number))).toHaveLength(1)
  })
})
