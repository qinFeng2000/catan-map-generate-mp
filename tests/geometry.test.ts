import { describe, expect, it } from 'vitest'
import { BOARD_PRESETS } from '@/presets/board-presets'
import { edgeEndpoints, hexDistance } from '@/geometry/hex'
import { buildTopology } from '@/geometry/topology'

describe('hex geometry', () => {
  it('computes axial distance', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2)
  })

  it('builds 54 intersections for the 3-4 player island', () => {
    const topology = buildTopology(BOARD_PRESETS.base.landCoords)
    expect(topology.intersections).toHaveLength(54)
    expect(topology.coastalHexKeys.size).toBeGreaterThan(0)
    expect(topology.intersections.some((point) => point.hexKeys.length === 3)).toBe(true)
  })

  it('maps every fixed harbor opening to a land-facing edge', () => {
    for (const preset of Object.values(BOARD_PRESETS)) {
      const land = new Set(preset.landCoords.map(({ q, r }) => `${q},${r}`))
      for (const harbor of preset.harbors) {
        const direction = [
          { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
          { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
        ][harbor.facingEdge]!
        expect(land.has(`${harbor.sea.q + direction.q},${harbor.sea.r + direction.r}`)).toBe(true)
        expect(edgeEndpoints(harbor.sea, 20, harbor.facingEdge)).toHaveLength(2)
      }
    }
  })
})
