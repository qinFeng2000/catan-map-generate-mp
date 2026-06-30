import { coordKey, type BoardPreset, type BoardVersion, type LandHex, type NumberToken, type ProductiveResource } from '@/domain/board'
import { numberGroup, type GeneratorRules, type NumberGroup } from '@/domain/rules'
import type { BoardTopology } from '@/geometry/topology'
import { fisherYates, type RandomSource } from './random'

export interface NumberSearchDiagnostics {
  visitedNodes: number
  pruned: Record<'groupRepeat' | 'adjacentGroup' | 'woodBrickOverlap' | 'budget', number>
}

export type NumberSearchResult =
  | ({ ok: true; hexes: LandHex[] } & NumberSearchDiagnostics)
  | ({ ok: false } & NumberSearchDiagnostics)

const mayRepeatGroup = (
  version: BoardVersion,
  group: NumberGroup,
  number: NumberToken,
  currentExactNumbers: ReadonlyMap<NumberToken, number>,
  hotExceptionUsed: boolean,
): boolean => version === 'extension' && group === 'hot' && !hotExceptionUsed && !currentExactNumbers.has(number)

const allowedWoodBrickOverlap = (version: BoardVersion): number => version === 'extension' ? 1 : 0

export const placeNumbers = (
  preset: BoardPreset,
  resourceHexes: readonly LandHex[],
  rules: GeneratorRules,
  topology: BoardTopology,
  random: RandomSource,
  nodeBudget: number,
): NumberSearchResult => {
  const hexes: LandHex[] = resourceHexes.map((hex) => ({ ...hex, coord: { ...hex.coord }, number: null }))
  const productive = hexes.filter((hex): hex is LandHex & { resource: ProductiveResource } => hex.resource !== 'desert')
  const byKey = new Map(productive.map((hex) => [coordKey(hex.coord), hex]))
  const assigned = new Map<string, NumberToken>()
  const groupCounts = new Map<ProductiveResource, Map<NumberGroup, number>>()
  const exactCounts = new Map<ProductiveResource, Map<NumberToken, number>>()
  const numbers = fisherYates(preset.numberBag, random)
  const pruned = { groupRepeat: 0, adjacentGroup: 0, woodBrickOverlap: 0, budget: 0 }
  let visitedNodes = 0

  const groupsFor = (resource: ProductiveResource) => {
    const value = groupCounts.get(resource) ?? new Map<NumberGroup, number>()
    groupCounts.set(resource, value)
    return value
  }
  const exactFor = (resource: ProductiveResource) => {
    const value = exactCounts.get(resource) ?? new Map<NumberToken, number>()
    exactCounts.set(resource, value)
    return value
  }
  const overlapCount = (): number => {
    const wood = exactFor('wood')
    const brick = exactFor('brick')
    return [...wood.keys()].filter((number) => brick.has(number)).length
  }
  const adjust = <K>(map: Map<K, number>, key: K, delta: 1 | -1) => {
    const next = (map.get(key) ?? 0) + delta
    if (next === 0) map.delete(key)
    else map.set(key, next)
  }

  const search = (index: number, hotExceptionCount: number): boolean => {
    if (index === numbers.length) {
      if (rules.uniqueNumberGroupPerResource && preset.version === 'extension' && hotExceptionCount !== 1) return false
      if (rules.disjointWoodBrickNumbers && overlapCount() !== allowedWoodBrickOverlap(preset.version)) return false
      return true
    }
    if (visitedNodes >= nodeBudget) { pruned.budget += 1; return false }
    const number = numbers[index]!
    const group = numberGroup(number)
    const emptyKeys = [...byKey.keys()].filter((key) => !assigned.has(key))
    for (const key of fisherYates(emptyKeys, random)) {
      visitedNodes += 1
      const hex = byKey.get(key)!
      const groups = groupsFor(hex.resource)
      const exact = exactFor(hex.resource)
      const repeated = (groups.get(group) ?? 0) > 0
      const allowedRepeat = repeated && rules.uniqueNumberGroupPerResource
        ? mayRepeatGroup(preset.version, group, number, exact, hotExceptionCount > 0)
        : false
      if (rules.uniqueNumberGroupPerResource && repeated && !allowedRepeat) { pruned.groupRepeat += 1; continue }
      if (rules.forbidAdjacentSameNumberGroup && (topology.neighbors.get(key) ?? []).some((neighbor) => {
        const adjacent = assigned.get(neighbor)
        return adjacent !== undefined && numberGroup(adjacent) === group
      })) { pruned.adjacentGroup += 1; continue }

      assigned.set(key, number)
      adjust(groups, group, 1)
      adjust(exact, number, 1)
      if (rules.disjointWoodBrickNumbers && overlapCount() > allowedWoodBrickOverlap(preset.version)) {
        pruned.woodBrickOverlap += 1
      } else if (search(index + 1, hotExceptionCount + (allowedRepeat ? 1 : 0))) {
        return true
      }
      adjust(exact, number, -1)
      adjust(groups, group, -1)
      assigned.delete(key)
    }
    return false
  }

  if (!search(0, 0)) return { ok: false, visitedNodes, pruned }
  for (const [key, number] of assigned) byKey.get(key)!.number = number
  return { ok: true, hexes, visitedNodes, pruned }
}
