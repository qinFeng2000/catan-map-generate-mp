import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '@/domain/rules'
import { BOARD_PRESETS } from '@/presets/board-presets'
import { loadBoardState, saveBoardState, STORAGE_KEY, type PersistedBoardState, type StorageAdapter } from '@/storage/board-storage'

const preset = BOARD_PRESETS.base
let numberIndex = 0
const validPersistedState: PersistedBoardState = {
  schemaVersion: 1,
  version: 'base',
  rules: DEFAULT_RULES,
  board: {
    version: 'base', seed: 1, createdAt: 1,
    metrics: { sameNumberMinDistance: 2, resourcePipRange: 3, intersectionMaxPips: 12, intersectionPipRange: 8, intersectionStdDev: 2, woodBrickSharedPips: 0, normalizedScore: 0.5 },
    hexes: preset.landCoords.map((coord, index) => {
      const resource = preset.resourceBag[index]!
      return { id: `${coord.q},${coord.r}`, coord, resource, number: resource === 'desert' ? null : preset.numberBag[numberIndex++]! }
    }),
  },
}
const mapStorage = (memory: Map<string, unknown>): StorageAdapter => ({
  get: (key) => memory.get(key), set: (key, value) => { memory.set(key, value) }, remove: (key) => { memory.delete(key) },
})

describe('board storage', () => {
  it('round-trips schema v1 and rejects malformed or future records', () => {
    const memory = new Map<string, unknown>()
    const adapter = mapStorage(memory)
    saveBoardState(validPersistedState, adapter)
    expect(loadBoardState(adapter)).toEqual(validPersistedState)
    memory.set(STORAGE_KEY, { schemaVersion: 99 })
    expect(loadBoardState(adapter)).toBeNull()
  })
})
