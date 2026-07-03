import type { CSSProperties } from 'react'
import { describe, expect, it } from 'vitest'
import { RESOURCE_COLORS } from '@/renderer/board-scene'
import {
  ACTIVE_THEME_ID,
  activeTheme,
  stoneBlue,
  themeCssVariables,
  themeRegistry,
} from '@/theme'

const expectedStoneBlue = {
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
} as const

describe('theme registry', () => {
  it('selects Stone Blue as the active registered theme', () => {
    expect(ACTIVE_THEME_ID).toBe('stoneBlue')
    expect(themeRegistry.stoneBlue).toBe(stoneBlue)
    expect(activeTheme).toBe(stoneBlue)
  })

  it('defines the complete Stone Blue palette', () => {
    expect(stoneBlue).toEqual(expectedStoneBlue)
  })

  it('maps UI colors to Taro-compatible CSS custom properties', () => {
    const variables: CSSProperties = themeCssVariables(stoneBlue)

    expect(variables).toEqual({
      '--theme-page': '#DDE5EA',
      '--theme-surface': '#EEF2F3',
      '--theme-primary': '#647D8C',
      '--theme-text': '#3E5664',
      '--theme-muted': '#71838D',
      '--theme-border': '#B9C8CF',
      '--theme-overlay': 'rgba(62, 86, 100, 0.38)',
      '--theme-danger-surface': '#E8DEDD',
      '--theme-danger-text': '#805D5A',
      '--theme-on-primary': '#FFFFFF',
    })
  })

  it('keeps the legacy resource palette separate from themes', () => {
    expect(RESOURCE_COLORS).toEqual({
      wood: '#3f8f4b',
      wool: '#8fd694',
      grain: '#f0c84b',
      brick: '#c8793d',
      ore: '#7d8996',
      desert: '#ead8a8',
      sea: '#69a9d2',
    })
    expect(stoneBlue).not.toHaveProperty('resourceColors')
  })
})
