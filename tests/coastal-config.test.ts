import { describe, expect, it } from 'vitest'
import { BOARD_PRESETS } from '@/presets/board-presets'
import {
  buildCoastalPreset,
  buildHarborPresets,
  COASTAL_CONFIGS,
  isGenericHarborKind,
  validateCoastalConfig,
} from '@/presets/coastal-config'

describe('coastal config', () => {
  it.each([
    ['base', 9, 4, 5],
    ['extension', 11, 5, 6],
  ] as const)('%s defines %i harbors (%i generic, %i resource)', (version, total, generic, resource) => {
    const harbors = COASTAL_CONFIGS[version].harbors
    expect(harbors).toHaveLength(total)
    expect(harbors.filter((harbor) => isGenericHarborKind(harbor.kind))).toHaveLength(generic)
    expect(harbors.filter((harbor) => !isGenericHarborKind(harbor.kind))).toHaveLength(resource)
  })

  it.each(['base', 'extension'] as const)('validates %s coastal config against land boundary', (version) => {
    const preset = BOARD_PRESETS[version]
    expect(validateCoastalConfig(preset.landCoords, COASTAL_CONFIGS[version])).toEqual([])
  })

  it('builds stable harbor ids and wires sea ring from land coords', () => {
    const base = buildCoastalPreset('base', BOARD_PRESETS.base.landCoords)
    expect(base.harbors.map((harbor) => harbor.id)).toEqual([
      'base-h0', 'base-h1', 'base-h2', 'base-h3', 'base-h4',
      'base-h5', 'base-h6', 'base-h7', 'base-h8',
    ])
    expect(base.seaCoords).toEqual([...BOARD_PRESETS.base.seaCoords])
    expect(buildHarborPresets('base')).toEqual([...BOARD_PRESETS.base.harbors])
  })
})
