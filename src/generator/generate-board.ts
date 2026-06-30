import type { BoardMetrics, BoardPreset, BoardVersion, GeneratedBoard, LandHex } from '@/domain/board'
import type { GeneratorRules } from '@/domain/rules'
import { buildTopology } from '@/geometry/topology'
import { BOARD_PRESETS } from '@/presets/board-presets'
import { validateHardRules } from './hard-rules'
import { placeNumbers } from './number-search'
import { mulberry32 } from './random'
import { placeResources } from './resource-search'
import { compareMetrics, scoreBoard } from './scoring'

export interface GenerateOptions {
  seed?: number
  targetCandidates?: number
  maxAttempts?: number
  resourceNodeBudget?: number
  numberNodeBudget?: number
  yieldEvery?: number
  yieldControl?: () => Promise<void>
  now?: () => number
  presetOverride?: BoardPreset
}

export interface GenerationBudget {
  targetCandidates: number
  maxAttempts: number
  resourceNodeBudget: number
  numberNodeBudget: number
  yieldEvery: number
}

const BASE_GENERATION_BUDGET: GenerationBudget = {
  targetCandidates: 200,
  maxAttempts: 400,
  resourceNodeBudget: 5_000,
  numberNodeBudget: 50_000,
  yieldEvery: 10,
}

const EXTENSION_GENERATION_BUDGET: GenerationBudget = {
  targetCandidates: 16,
  maxAttempts: 80,
  resourceNodeBudget: 5_000,
  numberNodeBudget: 50_000,
  yieldEvery: 4,
}

export const defaultGenerationBudget = (version: BoardVersion): GenerationBudget =>
  version === 'extension' ? EXTENSION_GENERATION_BUDGET : BASE_GENERATION_BUDGET

export interface GenerationDiagnostics {
  attempts: number
  validCandidates: number
  resourceNodes: number
  numberNodes: number
  pruned: Record<string, number>
}

export type GenerateBoardResult =
  | { ok: true; board: GeneratedBoard; diagnostics: GenerationDiagnostics }
  | { ok: false; diagnostics: GenerationDiagnostics; message: string }

export const generateBoard = async (
  version: BoardVersion,
  rules: GeneratorRules,
  options: GenerateOptions = {},
): Promise<GenerateBoardResult> => {
  const preset = options.presetOverride ?? BOARD_PRESETS[version]
  const seed = options.seed ?? Math.floor(Math.random() * 0x1_0000_0000)
  const budget = defaultGenerationBudget(version)
  const targetCandidates = options.targetCandidates ?? budget.targetCandidates
  const maxAttempts = options.maxAttempts ?? budget.maxAttempts
  const resourceNodeBudget = options.resourceNodeBudget ?? budget.resourceNodeBudget
  const numberNodeBudget = options.numberNodeBudget ?? budget.numberNodeBudget
  const yieldEvery = options.yieldEvery ?? budget.yieldEvery
  const yieldControl = options.yieldControl ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
  const now = options.now ?? Date.now
  const random = mulberry32(seed)
  const topology = buildTopology(preset.landCoords)
  const diagnostics: GenerationDiagnostics = { attempts: 0, validCandidates: 0, resourceNodes: 0, numberNodes: 0, pruned: {} }
  let best: { hexes: LandHex[]; metrics: BoardMetrics } | null = null

  const mergePruned = (pruned: Record<string, number>) => Object.entries(pruned).forEach(([key, count]) => {
    diagnostics.pruned[key] = (diagnostics.pruned[key] ?? 0) + count
  })

  for (let attempt = 0; attempt < maxAttempts && diagnostics.validCandidates < targetCandidates; attempt += 1) {
    diagnostics.attempts = attempt + 1
    const resources = placeResources(preset, rules, topology, random, resourceNodeBudget)
    diagnostics.resourceNodes += resources.visitedNodes; mergePruned(resources.pruned)
    if (resources.ok) {
      const numbers = placeNumbers(preset, resources.hexes, rules, topology, random, numberNodeBudget)
      diagnostics.numberNodes += numbers.visitedNodes; mergePruned(numbers.pruned)
      if (numbers.ok) {
        const violations = validateHardRules(numbers.hexes, preset, rules, topology)
        violations.forEach(({ rule }) => { diagnostics.pruned[rule] = (diagnostics.pruned[rule] ?? 0) + 1 })
        if (violations.length === 0) {
          const metrics = scoreBoard(numbers.hexes, preset, rules, topology)
          if (!best || compareMetrics(metrics, best.metrics, rules, version) > 0) best = { hexes: numbers.hexes, metrics }
          diagnostics.validCandidates += 1
        }
      }
    }
    if ((attempt + 1) % yieldEvery === 0) await yieldControl()
  }

  if (!best) return { ok: false, diagnostics, message: '未找到满足全部规则的地图，请调整约束后重试' }
  return {
    ok: true,
    diagnostics,
    board: { version, hexes: best.hexes, metrics: best.metrics, seed, createdAt: now() },
  }
}
