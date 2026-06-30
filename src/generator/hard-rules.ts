import {
  coordKey,
  PRODUCTIVE_RESOURCES,
  type BoardPreset,
  type LandHex,
  type NumberToken,
} from '@/domain/board'
import { numberGroup, type GeneratorRules, type NumberGroup } from '@/domain/rules'
import type { BoardTopology } from '@/geometry/topology'

export type HardRuleId =
  | 'coastal-desert'
  | 'resource-number-group'
  | 'intersection-resource-limit'
  | 'adjacent-number-group'
  | 'wood-brick-overlap'

export interface HardRuleViolation { rule: HardRuleId; hexKeys: readonly string[]; message: string }

export const validateHardRules = (
  board: readonly LandHex[],
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
): HardRuleViolation[] => {
  const byKey = new Map(board.map((hex) => [coordKey(hex.coord), hex]))
  const violations: HardRuleViolation[] = []

  if (rules.avoidCoastalDesert) {
    for (const key of topology.coastalHexKeys) {
      if (byKey.get(key)?.resource === 'desert') violations.push({ rule: 'coastal-desert', hexKeys: [key], message: '沙漠位于海岸' })
    }
  }

  if (rules.uniqueNumberGroupPerResource) {
    let allowedHotRepeats = 0
    for (const resource of PRODUCTIVE_RESOURCES) {
      const grouped = new Map<NumberGroup, LandHex[]>()
      board.filter((hex) => hex.resource === resource && hex.number !== null).forEach((hex) => {
        const group = numberGroup(hex.number!)
        grouped.set(group, [...(grouped.get(group) ?? []), hex])
      })
      for (const [group, hexes] of grouped) {
        if (hexes.length <= 1) continue
        const exact = new Set(hexes.map((hex) => hex.number))
        const allowed = preset.version === 'extension' && group === 'hot' && hexes.length === 2 && exact.has(6) && exact.has(8)
        if (allowed) allowedHotRepeats += 1
        else violations.push({ rule: 'resource-number-group', hexKeys: hexes.map((hex) => hex.id), message: '同一资源出现重复数字组' })
      }
    }
    if (preset.version === 'extension' && allowedHotRepeats !== 1) violations.push({ rule: 'resource-number-group', hexKeys: [], message: '扩充版必须且只能使用一个 6/8 例外' })
  }

  if (rules.intersectionResourceLimitEnabled) {
    for (const intersection of topology.intersections) {
      for (const resource of PRODUCTIVE_RESOURCES) {
        const keys = intersection.hexKeys.filter((key) => byKey.get(key)?.resource === resource)
        if (keys.length > rules.maxSameResourcePerIntersection) violations.push({ rule: 'intersection-resource-limit', hexKeys: keys, message: '交叉点同类资源超过上限' })
      }
    }
  }

  if (rules.forbidAdjacentSameNumberGroup) {
    for (const [key, neighbors] of topology.neighbors) {
      const left = byKey.get(key)
      if (left?.number === null || left?.number === undefined) continue
      for (const neighbor of neighbors.filter((item) => item > key)) {
        const right = byKey.get(neighbor)
        if (right?.number !== null && right?.number !== undefined && numberGroup(left.number) === numberGroup(right.number)) {
          violations.push({ rule: 'adjacent-number-group', hexKeys: [key, neighbor], message: '相邻地块数字组相同' })
        }
      }
    }
  }

  if (rules.disjointWoodBrickNumbers) {
    const wood = new Set(board.filter((hex) => hex.resource === 'wood').map((hex) => hex.number).filter((value): value is NumberToken => value !== null))
    const shared = board.filter((hex) => hex.resource === 'brick' && hex.number !== null && wood.has(hex.number)).map((hex) => hex.number!)
    const expected = preset.version === 'extension' ? 1 : 0
    if (new Set(shared).size !== expected) violations.push({ rule: 'wood-brick-overlap', hexKeys: [], message: `木材与砖块共享数字数量必须为 ${expected}` })
  }

  return violations
}
