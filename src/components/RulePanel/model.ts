import type { GeneratorRules } from '@/domain/rules'

export type BooleanRuleKey = Exclude<keyof GeneratorRules, 'maxSameResourcePerIntersection'>
export const toggleRule = (rules: GeneratorRules, key: BooleanRuleKey): GeneratorRules => ({ ...rules, [key]: !rules[key] })
export const decrementIntersectionLimit = (rules: GeneratorRules): GeneratorRules => ({
  ...rules,
  maxSameResourcePerIntersection: Math.max(1, rules.maxSameResourcePerIntersection - 1) as 1 | 2 | 3,
})
export const incrementIntersectionLimit = (rules: GeneratorRules): GeneratorRules => ({
  ...rules,
  maxSameResourcePerIntersection: Math.min(3, rules.maxSameResourcePerIntersection + 1) as 1 | 2 | 3,
})
