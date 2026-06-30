import Taro from '@tarojs/taro'
import { useCallback, useEffect, useReducer } from 'react'
import type { BoardVersion } from '@/domain/board'
import { defaultRulesForVersion, type GeneratorRules } from '@/domain/rules'
import { initialPageState, pageReducer } from './page-state'
import { loadBoardState, saveBoardState } from '@/storage/board-storage'
import { runPageGeneration } from './generation-task'

export const useBoardGenerator = () => {
  const [state, dispatch] = useReducer(pageReducer, initialPageState)

  const runGeneration = useCallback(async (version: BoardVersion, rules: GeneratorRules) => {
    dispatch({ type: 'generation-started' })
    const result = await runPageGeneration(version, rules)
    if (!result.ok) {
      dispatch({ type: 'generation-failed', message: result.message, diagnostics: result.diagnostics })
      return
    }
    dispatch({ type: 'generation-succeeded', board: result.board, rules, diagnostics: result.diagnostics })
    saveBoardState({ schemaVersion: 1, version, rules, board: result.board })
  }, [])

  useEffect(() => {
    const persisted = loadBoardState()
    if (persisted) dispatch({ type: 'restored', persisted })
    else void runGeneration('base', defaultRulesForVersion('base'))
  }, [runGeneration])

  const changeVersion = useCallback((version: BoardVersion) => {
    const rules = defaultRulesForVersion(version)
    dispatch({ type: 'version-changed', version, rules })
    void runGeneration(version, rules)
  }, [runGeneration])
  const changeDraftRules = useCallback((rules: GeneratorRules) => dispatch({ type: 'draft-rules-changed', rules }), [])
  const regenerate = useCallback(() => runGeneration(state.version, state.draftRules), [runGeneration, state.draftRules, state.version])

  return { state, changeVersion, changeDraftRules, regenerate, dispatch }
}

export const openAlbumSettings = async (): Promise<void> => {
  await Taro.showModal({
    title: '需要相册权限',
    content: '请在设置中允许保存图片到相册',
    confirmText: '去设置',
  })
  await Taro.openSetting()
}
