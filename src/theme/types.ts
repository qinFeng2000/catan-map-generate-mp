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
  scene: {
    canvas: string
    numberToken: string
    numberText: string
    highProbabilityNumber: string
    title: string
    mutedText: string
    summaryText: string
  }
  platform: {
    navigationBarBackground: string
    navigationBarTextStyle: 'black' | 'white'
  }
}
