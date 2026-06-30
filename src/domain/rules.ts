import type { BoardVersion, NumberToken } from './board'

export interface GeneratorRules {
  avoidCoastalDesert: boolean
  uniqueNumberGroupPerResource: boolean
  intersectionResourceLimitEnabled: boolean
  maxSameResourcePerIntersection: 1 | 2 | 3
  maximizeSameNumberDistance: boolean
  forbidAdjacentSameNumberGroup: boolean
  disjointWoodBrickNumbers: boolean
  balanceResourcePips: boolean
  fairIntersections: boolean
}

export const DEFAULT_RULES: GeneratorRules = {
  avoidCoastalDesert: false,
  uniqueNumberGroupPerResource: true,
  intersectionResourceLimitEnabled: true,
  maxSameResourcePerIntersection: 1,
  maximizeSameNumberDistance: true,
  forbidAdjacentSameNumberGroup: false,
  disjointWoodBrickNumbers: true,
  balanceResourcePips: true,
  fairIntersections: true,
}

/** 5–6 人扩充版默认禁止相邻 6/8（hot 数字组） */
export const defaultRulesForVersion = (version: BoardVersion): GeneratorRules => ({
  ...DEFAULT_RULES,
  forbidAdjacentSameNumberGroup: version === 'extension',
})

export type NumberGroup = 'low' | 'hot' | '3' | '4' | '5' | '9' | '10' | '11'
export const numberGroup = (number: NumberToken): NumberGroup => {
  if (number === 2 || number === 12) return 'low'
  if (number === 6 || number === 8) return 'hot'
  return String(number) as NumberGroup
}
export const pipWeight = (number: NumberToken): number => 6 - Math.abs(7 - number)
