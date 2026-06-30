import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '@/domain/rules'
import { coordKey } from '@/domain/board'
import { buildTopology } from '@/geometry/topology'
import { mulberry32 } from '@/generator/random'
import { placeResources } from '@/generator/resource-search'
import { BOARD_PRESETS } from '@/presets/board-presets'

describe('placeResources', () => {
  it.each(['base', 'extension'] as const)('finds a default %s layout within budget', (version) => {
    const preset = BOARD_PRESETS[version]
    const topology = buildTopology(preset.landCoords)
    const result = placeResources(preset, DEFAULT_RULES, topology, mulberry32(20260630), 5_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.hexes).toHaveLength(preset.landCoords.length)
    for (const intersection of topology.intersections) {
      const resources = intersection.hexKeys
        .map((key) => result.hexes.find((hex) => coordKey(hex.coord) === key)?.resource)
        .filter((value) => value !== undefined && value !== 'desert')
      expect(new Set(resources).size).toBe(resources.length)
    }
  })
})
