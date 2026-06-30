import Taro from '@tarojs/taro'
import type { BoardVersion } from '@/domain/board'
import type { GeneratorRules } from '@/domain/rules'
import { generateBoard, type GenerateBoardResult } from '@/generator/generate-board'

type BoardGenerator = (version: BoardVersion, rules: GeneratorRules) => Promise<GenerateBoardResult>

const unexpectedFailure = (): GenerateBoardResult => ({
  ok: false,
  diagnostics: { attempts: 0, validCandidates: 0, resourceNodes: 0, numberNodes: 0, pruned: {} },
  message: '地图生成失败，请重试',
})

export const runPageGeneration = async (
  version: BoardVersion,
  rules: GeneratorRules,
  generate: BoardGenerator = generateBoard,
): Promise<GenerateBoardResult> => {
  Taro.showLoading({ title: '匹配规格地图', mask: true })
  try {
    return await generate(version, rules)
  } catch {
    return unexpectedFailure()
  } finally {
    Taro.hideLoading()
  }
}
