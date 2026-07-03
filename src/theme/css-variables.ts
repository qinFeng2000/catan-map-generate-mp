import type { CSSProperties } from 'react'
import type { ThemeDefinition } from './types'

type ThemeCssVariableName =
  | '--theme-page'
  | '--theme-surface'
  | '--theme-primary'
  | '--theme-text'
  | '--theme-muted'
  | '--theme-border'
  | '--theme-overlay'
  | '--theme-danger-surface'
  | '--theme-danger-text'
  | '--theme-on-primary'

export type ThemeCssVariables = CSSProperties & Record<ThemeCssVariableName, string>

export const themeCssVariables = (theme: ThemeDefinition): ThemeCssVariables => ({
  '--theme-page': theme.ui.page,
  '--theme-surface': theme.ui.surface,
  '--theme-primary': theme.ui.primary,
  '--theme-text': theme.ui.text,
  '--theme-muted': theme.ui.muted,
  '--theme-border': theme.ui.border,
  '--theme-overlay': theme.ui.overlay,
  '--theme-danger-surface': theme.ui.dangerSurface,
  '--theme-danger-text': theme.ui.dangerText,
  '--theme-on-primary': theme.ui.onPrimary,
})
