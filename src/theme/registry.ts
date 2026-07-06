import { desertYellow } from './desert-yellow'
import { stoneBlue } from './stone-blue'
import type { ThemeDefinition } from './types'

export const themeRegistry = {
  stoneBlue,
  desertYellow,
} as const satisfies Record<string, ThemeDefinition>

export type ThemeId = keyof typeof themeRegistry

export const ACTIVE_THEME_ID: ThemeId = 'desertYellow'
export const activeTheme = themeRegistry[ACTIVE_THEME_ID]
