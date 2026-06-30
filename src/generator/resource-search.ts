import { coordKey, isProductiveResource, type BoardPreset, type LandHex, type Resource } from '@/domain/board'
import type { GeneratorRules } from '@/domain/rules'
import type { BoardTopology } from '@/geometry/topology'
import { fisherYates, type RandomSource } from './random'

export type ResourceSearchResult =
  | { ok: true; hexes: LandHex[]; visitedNodes: number; pruned: Record<string, number> }
  | { ok: false; visitedNodes: number; pruned: Record<string, number> }

export const placeResources = (
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
  random: RandomSource,
  nodeBudget: number,
): ResourceSearchResult => {
  const coords = fisherYates(preset.landCoords, random)
  const priority = fisherYates(preset.resourceBag, random)
  const remaining = new Map<Resource, number>()
  const intersectionByKey = new Map(topology.intersections.map((intersection) => [intersection.key, intersection]))
  for (const resource of preset.resourceBag) remaining.set(resource, (remaining.get(resource) ?? 0) + 1)
  const assigned = new Map<string, Resource>()
  const pruned = { coastalDesert: 0, intersectionLimit: 0, budget: 0 }
  let visitedNodes = 0

  const validAt = (key: string, resource: Resource): boolean => {
    if (resource === 'desert' && rules.avoidCoastalDesert && topology.coastalHexKeys.has(key)) {
      pruned.coastalDesert += 1
      return false
    }
    if (!rules.intersectionResourceLimitEnabled || !isProductiveResource(resource)) return true
    for (const intersectionKey of topology.intersectionsByHex.get(key) ?? []) {
      const intersection = intersectionByKey.get(intersectionKey)
      const matching = intersection?.hexKeys.filter((hexKey) => assigned.get(hexKey) === resource).length ?? 0
      if (matching + 1 > rules.maxSameResourcePerIntersection) {
        pruned.intersectionLimit += 1
        return false
      }
    }
    return true
  }

  const search = (index: number): boolean => {
    if (index === coords.length) return true
    if (visitedNodes >= nodeBudget) { pruned.budget += 1; return false }
    const coord = coords[index]!
    const key = coordKey(coord)
    const choices = fisherYates([...new Set(priority.filter((resource) => (remaining.get(resource) ?? 0) > 0))], random)
    for (const resource of choices) {
      visitedNodes += 1
      if (!validAt(key, resource)) continue
      assigned.set(key, resource)
      remaining.set(resource, (remaining.get(resource) ?? 0) - 1)
      if (search(index + 1)) return true
      remaining.set(resource, (remaining.get(resource) ?? 0) + 1)
      assigned.delete(key)
    }
    return false
  }

  if (!search(0)) return { ok: false, visitedNodes, pruned }
  return {
    ok: true,
    visitedNodes,
    pruned,
    hexes: preset.landCoords.map((coord) => ({ id: coordKey(coord), coord, resource: assigned.get(coordKey(coord))!, number: null })),
  }
}
