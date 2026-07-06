import type { CSSProperties } from 'react'
import { rpx } from '@/shared/units'
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

export type ThemeLengthTransform = (designPx: number) => string

const resolveThemeValue = (
  value: string,
  transformLength: ThemeLengthTransform,
): string =>
  value.replace(/(-?\d*\.?\d+)rpx\b/g, (_, amount: string) =>
    transformLength(Number(amount)),
  )

export const themeCssVariables = (
  theme: ThemeDefinition,
  transformLength: ThemeLengthTransform = rpx,
): ThemeCssVariables => ({
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
  '--theme-picker-radius': resolveThemeValue(theme.appearance.pickerRadius, transformLength),
  '--theme-picker-border': resolveThemeValue(theme.appearance.pickerBorder, transformLength),
  '--theme-picker-shadow': resolveThemeValue(theme.appearance.pickerShadow, transformLength),
  '--theme-settings-radius': resolveThemeValue(theme.appearance.settingsRadius, transformLength),
  '--theme-settings-border': resolveThemeValue(theme.appearance.settingsBorder, transformLength),
  '--theme-map-radius': resolveThemeValue(theme.appearance.mapRadius, transformLength),
  '--theme-map-border': resolveThemeValue(theme.appearance.mapBorder, transformLength),
  '--theme-map-shadow': resolveThemeValue(theme.appearance.mapShadow, transformLength),
  '--theme-action-radius': resolveThemeValue(theme.appearance.actionRadius, transformLength),
  '--theme-primary-action-border': resolveThemeValue(theme.appearance.primaryActionBorder, transformLength),
  '--theme-secondary-action-border': resolveThemeValue(theme.appearance.secondaryActionBorder, transformLength),
  '--theme-secondary-action-text': resolveThemeValue(theme.appearance.secondaryActionText, transformLength),
  '--theme-error-border': resolveThemeValue(theme.appearance.errorBorder, transformLength),
  '--theme-panel-radius': resolveThemeValue(theme.appearance.panelRadius, transformLength),
  '--theme-panel-border': resolveThemeValue(theme.appearance.panelBorder, transformLength),
  '--theme-divider-border': resolveThemeValue(theme.appearance.dividerBorder, transformLength),
  '--theme-close-radius': resolveThemeValue(theme.appearance.closeRadius, transformLength),
  '--theme-close-border': resolveThemeValue(theme.appearance.closeBorder, transformLength),
  '--theme-close-background': resolveThemeValue(theme.appearance.closeBackground, transformLength),
  '--theme-close-text': resolveThemeValue(theme.appearance.closeText, transformLength),
  '--theme-close-line-height': resolveThemeValue(theme.appearance.closeLineHeight, transformLength),
  '--theme-step-radius': resolveThemeValue(theme.appearance.stepRadius, transformLength),
  '--theme-step-border': resolveThemeValue(theme.appearance.stepBorder, transformLength),
  '--theme-step-background': resolveThemeValue(theme.appearance.stepBackground, transformLength),
  '--theme-summary-radius': resolveThemeValue(theme.appearance.summaryRadius, transformLength),
  '--theme-summary-border': resolveThemeValue(theme.appearance.summaryBorder, transformLength),
  '--theme-summary-text': resolveThemeValue(theme.appearance.summaryText, transformLength),
})
