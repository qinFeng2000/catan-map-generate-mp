import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DrawCommand } from '@/renderer/commands'
import { executeCommands } from '@/renderer/canvas-executor'
import { scheduleCanvasDraw } from '@/components/BoardCanvas/draw'
import { boardCanvasStyle } from '@/components/BoardCanvas/style'

vi.mock('@/renderer/canvas-executor', () => ({
  executeCommands: vi.fn(async () => undefined),
}))

const commands: DrawCommand[] = [
  { kind: 'clear', width: 100, height: 100, color: '#ffffff' },
]

const runScheduled = (callback: (() => void) | null): void => {
  if (!callback) throw new Error('nextTick callback was not scheduled')
  callback()
}

describe('scheduleCanvasDraw', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('waits for the Canvas 2D node to mount before drawing', async () => {
    let nextTickCallback: (() => void) | null = null
    const context = {} as CanvasRenderingContext2D
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) }
    const query = {
      select: vi.fn(() => query),
      fields: vi.fn(() => query),
      exec: vi.fn((callback: (result: Array<{ node: typeof canvas; width: number; height: number }>) => void) => {
        callback([{ node: canvas, width: 343, height: 260 }])
      }),
    }
    const api = {
      nextTick: vi.fn((callback: () => void) => { nextTickCallback = callback }),
      createSelectorQuery: vi.fn(() => query),
    }

    scheduleCanvasDraw(api, 'board-canvas', 686, 520, commands)

    expect(api.createSelectorQuery).not.toHaveBeenCalled()
    runScheduled(nextTickCallback)
    await Promise.resolve()

    expect(query.select).toHaveBeenCalledWith('#board-canvas')
    expect(query.fields).toHaveBeenCalledWith({ node: true, size: true })
    expect(canvas.width).toBe(686)
    expect(canvas.height).toBe(520)
    expect(canvas.getContext).toHaveBeenCalledWith('2d')
    expect(executeCommands).toHaveBeenCalledWith(context, commands)
  })

  it('skips stale draws after the canvas unmounts', () => {
    let nextTickCallback: (() => void) | null = null
    const api = {
      nextTick: vi.fn((callback: () => void) => { nextTickCallback = callback }),
      createSelectorQuery: vi.fn(),
    }

    const cancel = scheduleCanvasDraw(api, 'board-canvas', 686, 520, commands)
    cancel()
    runScheduled(nextTickCallback)

    expect(api.createSelectorQuery).not.toHaveBeenCalled()
  })

  it('draws into the nested H5 canvas rendered by the Taro custom element', async () => {
    let nextTickCallback: (() => void) | null = null
    const context = {} as CanvasRenderingContext2D
    class FakeCanvas {
      width = 0
      height = 0
      getContext = vi.fn(() => context)
    }
    const canvas = new FakeCanvas()
    const host = { querySelector: vi.fn(() => canvas) }
    vi.stubGlobal('HTMLCanvasElement', FakeCanvas)
    vi.stubGlobal('document', { getElementById: vi.fn(() => host) })
    const api = {
      nextTick: vi.fn((callback: () => void) => { nextTickCallback = callback }),
      createSelectorQuery: vi.fn(),
    }

    scheduleCanvasDraw(api, 'share-canvas', 1200, 1800, commands)
    runScheduled(nextTickCallback)
    await Promise.resolve()

    expect(host.querySelector).toHaveBeenCalledWith('canvas')
    expect(canvas.width).toBe(1200)
    expect(canvas.height).toBe(1800)
    expect(api.createSelectorQuery).not.toHaveBeenCalled()
    expect(executeCommands).toHaveBeenCalledWith(context, commands)
  })
})

describe('boardCanvasStyle', () => {
  it('uses rpx display dimensions for visible page canvases', () => {
    expect(boardCanvasStyle({ designWidth: 686, designHeight: 520, renderWidth: 686, renderHeight: 520, offscreen: false })).toEqual({
      width: '686rpx',
      height: '520rpx',
    })
  })

  it('uses exact pixel dimensions for offscreen sharing canvases', () => {
    expect(boardCanvasStyle({ designWidth: 1600, designHeight: 2200, renderWidth: 1200, renderHeight: 1800, offscreen: true })).toEqual({
      width: '1200px',
      height: '1800px',
    })
  })
})
