import type { ThemeDefinition } from './types'

export const stoneBlue = {
  id: 'stoneBlue',
  name: '石板蓝',
  ui: {
    page: '#DDE5EA',
    surface: '#EEF2F3',
    primary: '#647D8C',
    text: '#3E5664',
    muted: '#71838D',
    border: '#B9C8CF',
    overlay: 'rgba(62, 86, 100, 0.38)',
    dangerSurface: '#E8DEDD',
    dangerText: '#805D5A',
    onPrimary: '#FFFFFF',
  },
  scene: {
    canvas: '#EEF2F3',
    numberToken: '#E9EDF0',
    numberText: '#3E5664',
    highProbabilityNumber: '#79534F',
    title: '#3E5664',
    mutedText: '#71838D',
    summaryText: '#526A76',
  },
  platform: {
    navigationBarBackground: '#DDE5EA',
    navigationBarTextStyle: 'black',
  },
} as const satisfies ThemeDefinition
