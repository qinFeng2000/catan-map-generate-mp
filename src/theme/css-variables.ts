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
  | '--theme-picker-radius'
  | '--theme-picker-border'
  | '--theme-picker-shadow'
  | '--theme-settings-radius'
  | '--theme-settings-border'
  | '--theme-map-radius'
  | '--theme-map-border'
  | '--theme-map-shadow'
  | '--theme-action-radius'
  | '--theme-primary-action-border'
  | '--theme-secondary-action-border'
  | '--theme-secondary-action-text'
  | '--theme-error-border'
  | '--theme-panel-radius'
  | '--theme-panel-border'
  | '--theme-divider-border'
  | '--theme-close-radius'
  | '--theme-close-border'
  | '--theme-close-background'
  | '--theme-close-text'
  | '--theme-close-line-height'
  | '--theme-step-radius'
  | '--theme-step-border'
  | '--theme-step-background'
  | '--theme-summary-radius'
  | '--theme-summary-border'
  | '--theme-summary-text'

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
  '--theme-picker-radius': theme.appearance.pickerRadius,
  '--theme-picker-border': theme.appearance.pickerBorder,
  '--theme-picker-shadow': theme.appearance.pickerShadow,
  '--theme-settings-radius': theme.appearance.settingsRadius,
  '--theme-settings-border': theme.appearance.settingsBorder,
  '--theme-map-radius': theme.appearance.mapRadius,
  '--theme-map-border': theme.appearance.mapBorder,
  '--theme-map-shadow': theme.appearance.mapShadow,
  '--theme-action-radius': theme.appearance.actionRadius,
  '--theme-primary-action-border': theme.appearance.primaryActionBorder,
  '--theme-secondary-action-border': theme.appearance.secondaryActionBorder,
  '--theme-secondary-action-text': theme.appearance.secondaryActionText,
  '--theme-error-border': theme.appearance.errorBorder,
  '--theme-panel-radius': theme.appearance.panelRadius,
  '--theme-panel-border': theme.appearance.panelBorder,
  '--theme-divider-border': theme.appearance.dividerBorder,
  '--theme-close-radius': theme.appearance.closeRadius,
  '--theme-close-border': theme.appearance.closeBorder,
  '--theme-close-background': theme.appearance.closeBackground,
  '--theme-close-text': theme.appearance.closeText,
  '--theme-close-line-height': theme.appearance.closeLineHeight,
  '--theme-step-radius': theme.appearance.stepRadius,
  '--theme-step-border': theme.appearance.stepBorder,
  '--theme-step-background': theme.appearance.stepBackground,
  '--theme-summary-radius': theme.appearance.summaryRadius,
  '--theme-summary-border': theme.appearance.summaryBorder,
  '--theme-summary-text': theme.appearance.summaryText,
})
