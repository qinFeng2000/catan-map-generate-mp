import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, defaultRulesForVersion, numberGroup, pipWeight } from '@/domain/rules'
import { BOARD_PRESETS } from '@/presets/board-presets'

describe('board presets', () => {
  it.each([
    ['base', 19, 18, 18, 9],
    ['extension', 30, 28, 22, 11],
  ] as const)('%s has fixed component counts', (version, land, numbers, sea, harbors) => {
    const preset = BOARD_PRESETS[version]
    expect(preset.landCoords).toHaveLength(land)
    expect(preset.numberBag).toHaveLength(numbers)
    expect(preset.seaCoords).toHaveLength(sea)
    expect(preset.harbors).toHaveLength(harbors)
    expect(preset.resourceBag).toHaveLength(land)
  })

  it('defines exact 5-6 player number token counts', () => {
    const counts = BOARD_PRESETS.extension.numberBag.reduce<Record<number, number>>((result, number) => {
      result[number] = (result[number] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({
      2: 2,
      3: 3,
      4: 3,
      5: 3,
      6: 3,
      8: 3,
      9: 3,
      10: 3,
      11: 3,
      12: 2,
    })
  })

  it('keeps every harbor fixed with a valid opening edge', () => {
    for (const preset of Object.values(BOARD_PRESETS)) {
      expect(new Set(preset.harbors.map((harbor) => `${harbor.sea.q},${harbor.sea.r}`)).size)
        .toBe(preset.harbors.length)
      expect(preset.harbors.every((harbor) => harbor.facingEdge >= 0 && harbor.facingEdge <= 5)).toBe(true)
    }
  })

  it('defines requested defaults and number semantics', () => {
    expect(DEFAULT_RULES).toMatchObject({
      avoidCoastalDesert: false,
      uniqueNumberGroupPerResource: true,
      intersectionResourceLimitEnabled: true,
      maxSameResourcePerIntersection: 1,
      maximizeSameNumberDistance: true,
      forbidAdjacentSameNumberGroup: false,
      disjointWoodBrickNumbers: true,
      balanceResourcePips: true,
      fairIntersections: true,
    })
    expect(defaultRulesForVersion('base').forbidAdjacentSameNumberGroup).toBe(false)
    expect(defaultRulesForVersion('extension').forbidAdjacentSameNumberGroup).toBe(true)
    expect(numberGroup(6)).toBe(numberGroup(8))
    expect(numberGroup(2)).toBe(numberGroup(12))
    expect(pipWeight(6)).toBe(5)
    expect(pipWeight(12)).toBe(1)
  })
})
