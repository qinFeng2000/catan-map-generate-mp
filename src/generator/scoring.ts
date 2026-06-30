import {
  coordKey,
  isProductiveResource,
  PRODUCTIVE_RESOURCES,
  type BoardMetrics,
  type BoardPreset,
  type BoardVersion,
  type GeneratedBoard,
  type LandHex,
  type ProductiveResource,
} from '@/domain/board'
import { numberGroup, pipWeight, type GeneratorRules, type NumberGroup } from '@/domain/rules'
import { hexDistance } from '@/geometry/hex'
import type { BoardTopology } from '@/geometry/topology'

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

export const standardDeviation = (values: readonly number[]): number => {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)
}

const distanceScore = (minimum: number, diameter: number): number => clamp01(minimum / diameter)
const resourceBalanceScore = (range: number): number => clamp01(1 - range / 30)
const intersectionFairnessScore = (range: number, deviation: number, maximum: number): number =>
  clamp01(1 - (0.5 * range / 14 + 0.3 * deviation / 7 + 0.2 * maximum / 15))

export const resourcePipTotals = (hexes: readonly LandHex[]): Map<ProductiveResource, number> => {
  const totals = new Map(PRODUCTIVE_RESOURCES.map((resource) => [resource, 0]))
  for (const hex of hexes) {
    if (!isProductiveResource(hex.resource) || hex.number === null) continue
    totals.set(hex.resource, totals.get(hex.resource)! + pipWeight(hex.number))
  }
  return totals
}

export const intersectionPips = (hexes: readonly LandHex[], topology: BoardTopology): number[] => {
  const byKey = new Map(hexes.map((hex) => [coordKey(hex.coord), hex]))
  return topology.intersections.map((intersection) => intersection.hexKeys.reduce((sum, key) => {
    const number = byKey.get(key)?.number
    return sum + (number === null || number === undefined ? 0 : pipWeight(number))
  }, 0)).filter((value) => value > 0)
}

export const scoreBoard = (
  hexes: readonly LandHex[],
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
): BoardMetrics => {
  const groups = new Map<NumberGroup, LandHex[]>()
  hexes.filter((hex) => hex.number !== null).forEach((hex) => {
    const group = numberGroup(hex.number!)
    groups.set(group, [...(groups.get(group) ?? []), hex])
  })
  const distances = [...groups.values()].flatMap((items) => items.flatMap((left, index) =>
    items.slice(index + 1).map((right) => hexDistance(left.coord, right.coord))))
  const sameNumberMinDistance = distances.length ? Math.min(...distances) : preset.diameter
  const resourceTotals = [...resourcePipTotals(hexes).values()]
  const resourcePipRange = Math.max(...resourceTotals) - Math.min(...resourceTotals)
  const pointPips = intersectionPips(hexes, topology)
  const intersectionMaxPips = Math.max(...pointPips)
  const intersectionPipRange = intersectionMaxPips - Math.min(...pointPips)
  const intersectionStdDev = standardDeviation(pointPips)
  const woodNumbers = new Set(hexes.filter((hex) => hex.resource === 'wood').map((hex) => hex.number))
  const shared = hexes.filter((hex) => hex.resource === 'brick' && hex.number !== null && woodNumbers.has(hex.number)).map((hex) => hex.number!)
  const woodBrickSharedPips = shared.length ? Math.min(...shared.map(pipWeight)) : 0
  const enabledScores = [
    rules.maximizeSameNumberDistance ? distanceScore(sameNumberMinDistance, preset.diameter) : null,
    rules.balanceResourcePips ? resourceBalanceScore(resourcePipRange) : null,
    rules.fairIntersections ? intersectionFairnessScore(intersectionPipRange, intersectionStdDev, intersectionMaxPips) : null,
  ].filter((value): value is number => value !== null)
  const normalizedScore = enabledScores.length ? enabledScores.reduce((sum, value) => sum + value, 0) / enabledScores.length : 0
  return { sameNumberMinDistance, resourcePipRange, intersectionMaxPips, intersectionPipRange, intersectionStdDev, woodBrickSharedPips, normalizedScore }
}

export const compareMetrics = (
  a: BoardMetrics,
  b: BoardMetrics,
  rules: GeneratorRules,
  version: BoardVersion,
): number => {
  if (version === 'extension' && rules.disjointWoodBrickNumbers && a.woodBrickSharedPips !== b.woodBrickSharedPips) return b.woodBrickSharedPips - a.woodBrickSharedPips
  if (a.normalizedScore !== b.normalizedScore) return a.normalizedScore - b.normalizedScore
  if (a.intersectionPipRange !== b.intersectionPipRange) return b.intersectionPipRange - a.intersectionPipRange
  if (a.resourcePipRange !== b.resourcePipRange) return b.resourcePipRange - a.resourcePipRange
  return a.sameNumberMinDistance - b.sameNumberMinDistance
}
