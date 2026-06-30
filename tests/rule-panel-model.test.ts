import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '@/domain/rules'
import { decrementIntersectionLimit, incrementIntersectionLimit, toggleRule } from '@/components/RulePanel/model'

describe('rule panel model', () => {
  it('keeps the intersection limit between 1 and 3', () => {
    expect(decrementIntersectionLimit({ ...DEFAULT_RULES, maxSameResourcePerIntersection: 1 }).maxSameResourcePerIntersection).toBe(1)
    expect(incrementIntersectionLimit({ ...DEFAULT_RULES, maxSameResourcePerIntersection: 3 }).maxSameResourcePerIntersection).toBe(3)
  })

  it('toggles only the requested boolean rule', () => {
    expect(toggleRule(DEFAULT_RULES, 'avoidCoastalDesert')).toEqual({ ...DEFAULT_RULES, avoidCoastalDesert: true })
  })
})
