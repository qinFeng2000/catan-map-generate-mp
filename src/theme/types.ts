export interface ThemeAppearance {
  pickerRadius: string
  pickerBorder: string
  pickerShadow: string
  settingsRadius: string
  settingsBorder: string
  mapRadius: string
  mapBorder: string
  mapShadow: string
  actionRadius: string
  primaryActionBorder: string
  secondaryActionBorder: string
  secondaryActionText: string
  errorBorder: string
  panelRadius: string
  panelBorder: string
  dividerBorder: string
  closeRadius: string
  closeBorder: string
  closeBackground: string
  closeText: string
  closeLineHeight: string
  stepRadius: string
  stepBorder: string
  stepBackground: string
  summaryRadius: string
  summaryBorder: string
  summaryText: string
}

export interface ThemeDefinition {
  id: string
  name: string
  ui: {
    page: string
    surface: string
    primary: string
    text: string
    muted: string
    border: string
    overlay: string
    dangerSurface: string
    dangerText: string
    onPrimary: string
  }
  appearance: ThemeAppearance
  scene: {
    canvas: string
    numberToken: string
    numberText: string
    highProbabilityNumber: string
    title: string
    mutedText: string
    summaryText: string
    algorithmText: string
  }
  platform: {
    navigationBarBackground: string
    navigationBarTextStyle: 'black' | 'white'
  }
}
