import type { DrawCommand } from '@/renderer/commands'
import { executeCommands, type Canvas2DContext } from '@/renderer/canvas-executor'

export interface Canvas2DNode {
  width: number
  height: number
  getContext: (contextId: '2d') => Canvas2DContext | null
}

interface CanvasQueryResult {
  node?: Canvas2DNode
}

interface CanvasSelectorQuery {
  select: (selector: string) => CanvasSelectorQuery
  fields: (options: { node: true; size: true }) => CanvasSelectorQuery
  exec: (callback: (result: CanvasQueryResult[]) => void) => void
}

interface CanvasDrawApi {
  createSelectorQuery?: () => unknown
  nextTick?: (callback: () => void) => void
}

const getH5Canvas = (canvasId: string): HTMLCanvasElement | null => {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') return null
  const host = document.getElementById(canvasId)
  if (host instanceof HTMLCanvasElement) return host
  const canvas = host?.querySelector('canvas')
  return canvas instanceof HTMLCanvasElement ? canvas : null
}

const initializeCanvasContext = (
  canvas: Canvas2DNode,
  renderWidth: number,
  renderHeight: number,
): Canvas2DContext => {
  canvas.width = renderWidth
  canvas.height = renderHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context not available')
  return context
}

const getCanvas2DContext = (
  api: CanvasDrawApi,
  canvasId: string,
  renderWidth: number,
  renderHeight: number,
): Promise<Canvas2DContext> => new Promise((resolve, reject) => {
  const h5Canvas = getH5Canvas(canvasId)
  if (h5Canvas) {
    resolve(initializeCanvasContext(h5Canvas, renderWidth, renderHeight))
    return
  }

  const query = api.createSelectorQuery?.() as CanvasSelectorQuery | undefined
  if (!query) {
    reject(new Error('Canvas 2D selector query not available'))
    return
  }

  query
    .select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((result) => {
      const canvas = result[0]?.node
      if (!canvas) {
        reject(new Error(`Canvas node "${canvasId}" not found`))
        return
      }
      try {
        resolve(initializeCanvasContext(canvas, renderWidth, renderHeight))
      } catch (error) {
        reject(error)
      }
    })
})

export const scheduleCanvasDraw = (
  api: CanvasDrawApi,
  canvasId: string,
  renderWidth: number,
  renderHeight: number,
  commands: readonly DrawCommand[],
  onDrawn?: () => void,
): (() => void) => {
  let cancelled = false
  const draw = () => {
    if (cancelled) return
    void getCanvas2DContext(api, canvasId, renderWidth, renderHeight)
      .then((context) => {
        if (cancelled) return undefined
        return executeCommands(context, commands)
      })
      .then(() => {
        if (!cancelled) onDrawn?.()
      })
  }

  if (api.nextTick) api.nextTick(draw)
  else void Promise.resolve().then(draw)

  return () => { cancelled = true }
}
