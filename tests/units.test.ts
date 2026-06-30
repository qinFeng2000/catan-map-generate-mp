import Taro from '@tarojs/taro'
import { describe, expect, it, vi } from 'vitest'
import { getDesignCanvasWidth, getRuntimeWindowWidth, getRuntimePixelRatio, toCanvasPixelSize, toDisplayCanvasSize } from '@/shared/units'

describe('units', () => {
  it('returns design-width canvas size within 750 layout', () => {
    expect(getDesignCanvasWidth(48, 686)).toBe(686)
    expect(getDesignCanvasWidth(48, 800)).toBe(702)
  })

  it('maps design size to device canvas pixels', () => {
    expect(toCanvasPixelSize(750, 1000, 375)).toEqual({ width: 375, height: 500 })
    expect(toCanvasPixelSize(686, 800, 375)).toEqual({ width: 343, height: 400 })
    expect(toCanvasPixelSize(750, 1000, 375, 2)).toEqual({ width: 750, height: 1000 })
  })

  it('maps page display canvas to 2x screen pixels without DPR scaling', () => {
    expect(toDisplayCanvasSize(686, 520, 375)).toEqual({ width: 686, height: 520 })
    expect(toDisplayCanvasSize(686, 520, 375, 1)).toEqual({ width: 343, height: 260 })
  })

  it('uses non-deprecated runtime APIs for window width and pixel ratio', () => {
    const runtime = Taro as unknown as {
      getWindowInfo: ReturnType<typeof vi.fn>
      getDeviceInfo: ReturnType<typeof vi.fn>
      getSystemInfoSync: ReturnType<typeof vi.fn>
    }
    runtime.getWindowInfo = vi.fn(() => ({ windowWidth: 390 }))
    runtime.getDeviceInfo = vi.fn(() => ({ pixelRatio: 3 }))
    runtime.getSystemInfoSync = vi.fn(() => ({ windowWidth: 1, pixelRatio: 1 }))

    expect(getRuntimeWindowWidth()).toBe(390)
    expect(getRuntimePixelRatio()).toBe(3)
    expect(runtime.getSystemInfoSync).not.toHaveBeenCalled()
  })
})
