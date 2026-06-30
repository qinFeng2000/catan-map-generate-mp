import Taro from '@tarojs/taro'
import type { BoardVersion, GeneratedBoard } from '@/domain/board'
import type { GeneratorRules } from '@/domain/rules'

export const STORAGE_KEY = 'hex-map-generator:v1'
export interface StorageAdapter { get(key: string): unknown; set(key: string, value: unknown): void; remove(key: string): void }
export interface PersistedBoardState {
  schemaVersion: 1
  version: BoardVersion
  rules: GeneratorRules
  board: GeneratedBoard
}

export const taroStorage: StorageAdapter = {
  get: (key) => Taro.getStorageSync(key),
  set: (key, value) => Taro.setStorageSync(key, value),
  remove: (key) => Taro.removeStorageSync(key),
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isRules = (value: unknown): value is GeneratorRules => {
  if (!isRecord(value)) return false
  const booleans: (keyof GeneratorRules)[] = [
    'avoidCoastalDesert', 'uniqueNumberGroupPerResource', 'intersectionResourceLimitEnabled',
    'maximizeSameNumberDistance', 'forbidAdjacentSameNumberGroup', 'disjointWoodBrickNumbers',
    'balanceResourcePips', 'fairIntersections',
  ]
  return booleans.every((key) => typeof value[key] === 'boolean') && [1, 2, 3].includes(value.maxSameResourcePerIntersection as number)
}
const isBoard = (value: unknown): value is GeneratedBoard => {
  if (!isRecord(value) || (value.version !== 'base' && value.version !== 'extension') || !Array.isArray(value.hexes) || !isRecord(value.metrics)) return false
  const expectedLength = value.version === 'base' ? 19 : 30
  const metricKeys = ['sameNumberMinDistance', 'resourcePipRange', 'intersectionMaxPips', 'intersectionPipRange', 'intersectionStdDev', 'woodBrickSharedPips', 'normalizedScore']
  const resources = new Set(['wood', 'wool', 'grain', 'brick', 'ore', 'desert'])
  const numbers = new Set([2, 3, 4, 5, 6, 8, 9, 10, 11, 12, null])
  const validHexes = value.hexes.every((hex) => isRecord(hex) && typeof hex.id === 'string' && isRecord(hex.coord) && Number.isInteger(hex.coord.q) && Number.isInteger(hex.coord.r) && resources.has(String(hex.resource)) && numbers.has(hex.number as number | null))
  const metrics = value.metrics as Record<string, unknown>
  return value.hexes.length === expectedLength && validHexes && metricKeys.every((key) => typeof metrics[key] === 'number') && typeof value.seed === 'number' && typeof value.createdAt === 'number'
}
const isPersistedBoardState = (value: unknown): value is PersistedBoardState =>
  isRecord(value) && value.schemaVersion === 1 && (value.version === 'base' || value.version === 'extension') && isRules(value.rules) && isBoard(value.board) && value.board.version === value.version

export const loadBoardState = (storage: StorageAdapter = taroStorage): PersistedBoardState | null => {
  const value = storage.get(STORAGE_KEY)
  if (!isPersistedBoardState(value)) { if (value) storage.remove(STORAGE_KEY); return null }
  return value
}
export const saveBoardState = (state: PersistedBoardState, storage: StorageAdapter = taroStorage): void => storage.set(STORAGE_KEY, state)
