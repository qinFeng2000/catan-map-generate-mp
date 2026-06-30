import { describe, expect, it } from 'vitest'
import type { GeneratedBoard } from '@/domain/board'
import { DEFAULT_RULES, defaultRulesForVersion } from '@/domain/rules'
import { initialPageState, pageReducer, type PageState } from '@/pages/index/page-state'

const board: GeneratedBoard = {
  version: 'base', seed: 1, createdAt: 1, hexes: [],
  metrics: { sameNumberMinDistance: 2, resourcePipRange: 3, intersectionMaxPips: 12, intersectionPipRange: 8, intersectionStdDev: 2, woodBrickSharedPips: 0, normalizedScore: 0.5 },
}
const diagnostics = { attempts: 1, validCandidates: 0, resourceNodes: 10, numberNodes: 0, pruned: { intersectionLimit: 4 } }
const readyState: PageState = { ...initialPageState, status: 'ready', board, version: 'base', draftRules: DEFAULT_RULES, appliedRules: DEFAULT_RULES }
const changedRules = { ...DEFAULT_RULES, avoidCoastalDesert: true }

describe('pageReducer', () => {
  it('keeps the previous board through generation failure', () => {
    const generating = pageReducer(readyState, { type: 'generation-started' })
    const failed = pageReducer(generating, { type: 'generation-failed', message: '无解', diagnostics })
    expect(failed.board).toBe(readyState.board)
    expect(failed.status).toBe('generation-error')
  })

  it('marks rule edits dirty without replacing applied rules', () => {
    const next = pageReducer(readyState, { type: 'draft-rules-changed', rules: changedRules })
    expect(next.dirty).toBe(true)
    expect(next.appliedRules).toEqual(readyState.appliedRules)
  })

  it('resets draft rules when switching version', () => {
    const extensionRules = defaultRulesForVersion('extension')
    const next = pageReducer(readyState, { type: 'version-changed', version: 'extension', rules: extensionRules })
    expect(next.version).toBe('extension')
    expect(next.draftRules).toEqual(extensionRules)
    expect(next.draftRules.forbidAdjacentSameNumberGroup).toBe(true)
    expect(next.dirty).toBe(false)
  })
})
