import Taro from '@tarojs/taro'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedBoard } from '@/domain/board'
import { DEFAULT_RULES } from '@/domain/rules'
import type { GenerateBoardResult, GenerationDiagnostics } from '@/generator/generate-board'
import { runPageGeneration } from '@/pages/index/generation-task'

const diagnostics: GenerationDiagnostics = {
  attempts: 1,
  validCandidates: 0,
  resourceNodes: 0,
  numberNodes: 0,
  pruned: {},
}

const board: GeneratedBoard = {
  version: 'base',
  seed: 1,
  createdAt: 1,
  hexes: [],
  metrics: {
    sameNumberMinDistance: 2,
    resourcePipRange: 3,
    intersectionMaxPips: 12,
    intersectionPipRange: 8,
    intersectionStdDev: 2,
    woodBrickSharedPips: 0,
    normalizedScore: 0.5,
  },
}

const succeeded: GenerateBoardResult = { ok: true, diagnostics, board }
const failed: GenerateBoardResult = { ok: false, diagnostics, message: '无解' }

describe('runPageGeneration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows masked native loading and closes it after generation succeeds', async () => {
    const generate = vi.fn(async () => succeeded)

    const result = await runPageGeneration('base', DEFAULT_RULES, generate)

    expect(result).toBe(succeeded)
    expect(Taro.showLoading).toHaveBeenCalledWith({ title: '匹配规格地图', mask: true })
    expect(generate).toHaveBeenCalledWith('base', DEFAULT_RULES)
    expect(Taro.hideLoading).toHaveBeenCalledOnce()
  })

  it('closes loading when the generator returns no matching board', async () => {
    const generate = vi.fn(async () => failed)

    const result = await runPageGeneration('base', DEFAULT_RULES, generate)

    expect(result).toBe(failed)
    expect(Taro.hideLoading).toHaveBeenCalledOnce()
  })

  it('closes loading and converts an unexpected generator error', async () => {
    const generate = vi.fn(async (): Promise<GenerateBoardResult> => { throw new Error('boom') })

    const result = await runPageGeneration('base', DEFAULT_RULES, generate)

    expect(result).toEqual({
      ok: false,
      diagnostics: { attempts: 0, validCandidates: 0, resourceNodes: 0, numberNodes: 0, pruned: {} },
      message: '地图生成失败，请重试',
    })
    expect(Taro.hideLoading).toHaveBeenCalledOnce()
  })
})
