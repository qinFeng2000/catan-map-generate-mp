import { describe, expect, it } from 'vitest'
import type { BoardMetrics, LandHex } from '@/domain/board'
import { DEFAULT_RULES } from '@/domain/rules'
import { compareMetrics, resourcePipTotals, standardDeviation } from '@/generator/scoring'

const metricFixture = (overrides: Partial<BoardMetrics> = {}): BoardMetrics => ({
  sameNumberMinDistance: 2,
  resourcePipRange: 3,
  intersectionMaxPips: 12,
  intersectionPipRange: 8,
  intersectionStdDev: 2,
  woodBrickSharedPips: 0,
  normalizedScore: 0.5,
  ...overrides,
})
const defaultRules = DEFAULT_RULES
const extensionRules = DEFAULT_RULES
const scoreFixture: LandHex[] = [
  { id: '0,0', coord: { q: 0, r: 0 }, resource: 'wood', number: 6 },
  { id: '1,0', coord: { q: 1, r: 0 }, resource: 'wood', number: 9 },
]

describe('scoring', () => {
  it('prefers the lowest 5-6 wood/brick shared pip value before all soft metrics', () => {
    const lowOverlap = metricFixture({ woodBrickSharedPips: 2, normalizedScore: 0.2 })
    const highOverlap = metricFixture({ woodBrickSharedPips: 5, normalizedScore: 0.9 })
    expect(compareMetrics(lowOverlap, highOverlap, extensionRules, 'extension')).toBeGreaterThan(0)
  })

  it('prefers distance, balance, and fair intersections when enabled', () => {
    const balanced = metricFixture({ normalizedScore: 0.8 })
    const skewed = metricFixture({ normalizedScore: 0.3 })
    expect(compareMetrics(balanced, skewed, defaultRules, 'base')).toBeGreaterThan(0)
  })

  it('calculates transparent raw values', () => {
    expect(resourcePipTotals(scoreFixture).get('wood')).toBe(9)
    expect(standardDeviation([2, 2, 2])).toBe(0)
  })
})
