import type { CSSProperties } from 'react'
import { describe, expect, it } from 'vitest'
import { RESOURCE_COLORS } from '@/renderer/board-scene'
import {
  ACTIVE_THEME_ID,
  activeTheme,
  desertYellow,
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
  appearance: {
    pickerRadius: '18rpx',
    pickerBorder: '2rpx solid #B9C8CF',
    pickerShadow: 'none',
    settingsRadius: '18rpx',
    settingsBorder: '2rpx solid #3E5664',
    mapRadius: '22rpx',
    mapBorder: '2rpx solid #B9C8CF',
    mapShadow: 'none',
    actionRadius: '16rpx',
    primaryActionBorder: '2rpx solid #647D8C',
    secondaryActionBorder: '2rpx solid #647D8C',
    secondaryActionText: '#3E5664',
    errorBorder: '2rpx solid #B9C8CF',
    panelRadius: '28rpx 28rpx 0 0',
    panelBorder: '2rpx solid #B9C8CF',
    dividerBorder: '2rpx solid #B9C8CF',
    closeRadius: '14rpx',
    closeBorder: '2rpx solid #B9C8CF',
    closeBackground: '#DDE5EA',
    closeText: '#3E5664',
    closeLineHeight: '52rpx',
    stepRadius: '12rpx',
    stepBorder: '2rpx solid #B9C8CF',
    stepBackground: '#DDE5EA',
    summaryRadius: '18rpx',
    summaryBorder: '2rpx solid #B9C8CF',
    summaryText: '#3E5664',
  },
  scene: {
    canvas: '#EEF2F3',
    numberToken: '#E9EDF0',
    numberText: '#3E5664',
    highProbabilityNumber: '#79534F',
    title: '#3E5664',
    mutedText: '#71838D',
    summaryText: '#526A76',
    algorithmText: '#71838D',
  },
  platform: {
    navigationBarBackground: '#DDE5EA',
    navigationBarTextStyle: 'black',
  },
} as const

const expectedDesertYellow = {
  id: 'desertYellow',
  name: '沙漠黄',
  ui: {
    page: '#F5F1E8',
    surface: '#FFFDF8',
    primary: '#D98B16',
    text: '#29333A',
    muted: '#73808A',
    border: '#EEE7DA',
    overlay: 'rgba(41, 51, 58, 0.32)',
    dangerSurface: '#FFF0EB',
    dangerText: '#8A3B2F',
    onPrimary: '#FFFFFF',
  },
  appearance: {
    pickerRadius: '24rpx',
    pickerBorder: '0 solid transparent',
    pickerShadow: '0 8rpx 22rpx rgba(41, 51, 58, 0.06)',
    settingsRadius: '24rpx',
    settingsBorder: '0 solid transparent',
    mapRadius: '28rpx',
    mapBorder: '0 solid transparent',
    mapShadow: '0 12rpx 30rpx rgba(41, 51, 58, 0.08)',
    actionRadius: '14rpx',
    primaryActionBorder: '0 solid transparent',
    secondaryActionBorder: '2rpx solid #D98B16',
    secondaryActionText: '#D98B16',
    errorBorder: '0 solid transparent',
    panelRadius: '32rpx 32rpx 0 0',
    panelBorder: '0 solid transparent',
    dividerBorder: '1rpx solid #EEE7DA',
    closeRadius: '999rpx',
    closeBorder: '0 solid transparent',
    closeBackground: '#FFF8EA',
    closeText: '#D98B16',
    closeLineHeight: '56rpx',
    stepRadius: '12rpx',
    stepBorder: '1rpx solid #EEE7DA',
    stepBackground: '#FFF8EA',
    summaryRadius: '20rpx',
    summaryBorder: '0 solid transparent',
    summaryText: '#52616B',
  },
  scene: {
    canvas: '#F7F4EC',
    numberToken: '#FFF7DD',
    numberText: '#24313A',
    highProbabilityNumber: '#C83A2F',
    title: '#29333A',
    mutedText: '#73808A',
    summaryText: '#52616B',
    algorithmText: '#8A959C',
  },
  platform: {
    navigationBarBackground: '#F5F1E8',
    navigationBarTextStyle: 'black',
  },
} as const

describe('theme registry', () => {
  it('registers both themes and selects Desert Yellow', () => {
    expect(themeRegistry.stoneBlue).toBe(stoneBlue)
    expect(themeRegistry.desertYellow).toBe(desertYellow)
    expect(ACTIVE_THEME_ID).toBe('desertYellow')
    expect(activeTheme).toBe(desertYellow)
  })

  it('defines the complete Stone Blue theme', () => {
    expect(stoneBlue).toEqual(expectedStoneBlue)
  })

  it('restores the complete Desert Yellow theme', () => {
    expect(desertYellow).toEqual(expectedDesertYellow)
  })

  it('maps UI and appearance values to Taro-compatible CSS custom properties', () => {
    const variables: CSSProperties = themeCssVariables(desertYellow)

    expect(variables).toEqual({
      '--theme-page': '#F5F1E8',
      '--theme-surface': '#FFFDF8',
      '--theme-primary': '#D98B16',
      '--theme-text': '#29333A',
      '--theme-muted': '#73808A',
      '--theme-border': '#EEE7DA',
      '--theme-overlay': 'rgba(41, 51, 58, 0.32)',
      '--theme-danger-surface': '#FFF0EB',
      '--theme-danger-text': '#8A3B2F',
      '--theme-on-primary': '#FFFFFF',
      '--theme-picker-radius': '24rpx',
      '--theme-picker-border': '0 solid transparent',
      '--theme-picker-shadow': '0 8rpx 22rpx rgba(41, 51, 58, 0.06)',
      '--theme-settings-radius': '24rpx',
      '--theme-settings-border': '0 solid transparent',
      '--theme-map-radius': '28rpx',
      '--theme-map-border': '0 solid transparent',
      '--theme-map-shadow': '0 12rpx 30rpx rgba(41, 51, 58, 0.08)',
      '--theme-action-radius': '14rpx',
      '--theme-primary-action-border': '0 solid transparent',
      '--theme-secondary-action-border': '2rpx solid #D98B16',
      '--theme-secondary-action-text': '#D98B16',
      '--theme-error-border': '0 solid transparent',
      '--theme-panel-radius': '32rpx 32rpx 0 0',
      '--theme-panel-border': '0 solid transparent',
      '--theme-divider-border': '1rpx solid #EEE7DA',
      '--theme-close-radius': '999rpx',
      '--theme-close-border': '0 solid transparent',
      '--theme-close-background': '#FFF8EA',
      '--theme-close-text': '#D98B16',
      '--theme-close-line-height': '56rpx',
      '--theme-step-radius': '12rpx',
      '--theme-step-border': '1rpx solid #EEE7DA',
      '--theme-step-background': '#FFF8EA',
      '--theme-summary-radius': '20rpx',
      '--theme-summary-border': '0 solid transparent',
      '--theme-summary-text': '#52616B',
    })
  })

  it('converts runtime rpx tokens for the target platform', () => {
    const variables = themeCssVariables(
      desertYellow,
      (value) => `${value / 40}rem`,
    )

    expect(variables['--theme-picker-radius']).toBe('0.6rem')
    expect(variables['--theme-picker-border']).toBe('0 solid transparent')
    expect(variables['--theme-picker-shadow']).toBe(
      '0 0.2rem 0.55rem rgba(41, 51, 58, 0.06)',
    )
    expect(variables['--theme-secondary-action-border']).toBe(
      '0.05rem solid #D98B16',
    )
    expect(JSON.stringify(variables)).not.toContain('rpx')
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
    expect(desertYellow).not.toHaveProperty('resourceColors')
  })
})
