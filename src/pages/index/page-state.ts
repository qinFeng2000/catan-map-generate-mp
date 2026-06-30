import type { BoardVersion, GeneratedBoard } from '@/domain/board'
import { defaultRulesForVersion, type GeneratorRules } from '@/domain/rules'
import type { GenerationDiagnostics } from '@/generator/generate-board'
import type { PersistedBoardState } from '@/storage/board-storage'

export type PageStatus = 'restoring' | 'generating' | 'ready' | 'generation-error' | 'exporting' | 'export-error'
export interface PageState {
  status: PageStatus
  version: BoardVersion
  draftRules: GeneratorRules
  appliedRules: GeneratorRules
  board: GeneratedBoard | null
  dirty: boolean
  message: string | null
  diagnostics: GenerationDiagnostics | null
}

export const initialPageState: PageState = {
  status: 'restoring', version: 'base', draftRules: defaultRulesForVersion('base'), appliedRules: defaultRulesForVersion('base'),
  board: null, dirty: false, message: null, diagnostics: null,
}

export type PageAction =
  | { type: 'restored'; persisted: PersistedBoardState }
  | { type: 'version-changed'; version: BoardVersion; rules: GeneratorRules }
  | { type: 'draft-rules-changed'; rules: GeneratorRules }
  | { type: 'generation-started' }
  | { type: 'generation-succeeded'; board: GeneratedBoard; rules: GeneratorRules; diagnostics: GenerationDiagnostics }
  | { type: 'generation-failed'; message: string; diagnostics: GenerationDiagnostics }
  | { type: 'export-started' }
  | { type: 'export-succeeded' }
  | { type: 'export-failed'; message: string }

export const pageReducer = (state: PageState, action: PageAction): PageState => {
  switch (action.type) {
    case 'restored': return { ...state, status: 'ready', version: action.persisted.version, draftRules: action.persisted.rules, appliedRules: action.persisted.rules, board: action.persisted.board, dirty: false, message: null }
    case 'version-changed': return {
      ...state,
      version: action.version,
      draftRules: action.rules,
      dirty: false,
      message: null,
    }
    case 'draft-rules-changed': return { ...state, draftRules: action.rules, dirty: true, message: null }
    case 'generation-started': return { ...state, status: 'generating', message: null }
    case 'generation-succeeded': return { ...state, status: 'ready', board: action.board, draftRules: action.rules, appliedRules: action.rules, dirty: false, message: null, diagnostics: action.diagnostics }
    case 'generation-failed': return { ...state, status: 'generation-error', message: action.message, diagnostics: action.diagnostics }
    case 'export-started': return { ...state, status: 'exporting', message: null }
    case 'export-succeeded': return { ...state, status: 'ready', message: null }
    case 'export-failed': return { ...state, status: 'export-error', message: action.message }
    default: return state
  }
}
