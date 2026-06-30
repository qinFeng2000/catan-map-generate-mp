import { describe, expect, it, vi } from 'vitest'
import type { BoardPreset } from '@/domain/board'
import { DEFAULT_RULES, defaultRulesForVersion } from '@/domain/rules'
import { defaultGenerationBudget, generateBoard } from '@/generator/generate-board'

const impossiblePreset: BoardPreset = {
  version: 'base',
  landCoords: [{ q: 0, r: 0 }, { q: 1, r: 0 }],
  seaCoords: [],
  resourceBag: ['wood', 'wood'],
  numberBag: [2, 3],
  harbors: [],
  diameter: 1,
}

describe('generateBoard', () => {
  it('uses a smaller default search budget for the extension board', () => {
    expect(defaultGenerationBudget('base')).toEqual({
      targetCandidates: 200,
      maxAttempts: 400,
      resourceNodeBudget: 5_000,
      numberNodeBudget: 50_000,
      yieldEvery: 10,
    })
    expect(defaultGenerationBudget('extension')).toEqual({
      targetCandidates: 16,
      maxAttempts: 80,
      resourceNodeBudget: 5_000,
      numberNodeBudget: 50_000,
      yieldEvery: 4,
    })
  })

  it('applies the extension default budget when options are omitted', async () => {
    const result = await generateBoard('extension', DEFAULT_RULES, { seed: 1, presetOverride: impossiblePreset })
    expect(result.ok).toBe(false)
    expect(result.diagnostics.attempts).toBe(80)
  })

  it.each(['base', 'extension'] as const)('generates a reproducible legal %s board', async (version) => {
    const rules = defaultRulesForVersion(version)
    const options = { seed: 1024, targetCandidates: 5, maxAttempts: 20, yieldEvery: 2, now: () => 1_719_705_600_000 }
    const first = await generateBoard(version, rules, options)
    const second = await generateBoard(version, rules, options)
    expect(first.ok).toBe(true)
    expect(second).toEqual(first)
    if (first.ok) expect(first.board.hexes.filter((hex) => hex.number !== null)).toHaveLength(version === 'base' ? 18 : 28)
  })

  it('yields between batches', async () => {
    const yieldControl = vi.fn(async () => undefined)
    await generateBoard('base', DEFAULT_RULES, { seed: 3, targetCandidates: 3, maxAttempts: 10, yieldEvery: 1, yieldControl })
    expect(yieldControl).toHaveBeenCalled()
  })

  it('returns diagnostics instead of a partial board when no legal candidate exists', async () => {
    const result = await generateBoard('base', DEFAULT_RULES, { seed: 1, targetCandidates: 1, maxAttempts: 1, resourceNodeBudget: 100, presetOverride: impossiblePreset })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.diagnostics.attempts).toBe(1)
  })
})
