import { stoneBlue } from './stone-blue'
import type { ThemeDefinition } from './types'

export const themeRegistry = {
  stoneBlue,
} satisfies Record<string, ThemeDefinition>

export type ThemeId = keyof typeof themeRegistry

export const ACTIVE_THEME_ID: ThemeId = 'stoneBlue'
export const activeTheme = themeRegistry[ACTIVE_THEME_ID]
