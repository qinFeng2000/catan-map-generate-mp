import Taro from '@tarojs/taro'

export type ShareResult = { ok: true } | { ok: false; reason: 'render' | 'download' | 'album-permission' | 'cancelled' }
export type ShareCanvas = HTMLCanvasElement | { width: number; height: number; getContext: (contextId: '2d') => unknown }
interface CanvasQueryResult {
  node?: ShareCanvas
}
interface CanvasSelectorQuery {
  select: (selector: string) => CanvasSelectorQuery
  fields: (options: { node: true; size: true }) => CanvasSelectorQuery
  exec: (callback: (result: CanvasQueryResult[]) => void) => void
}
interface ShareCanvasToTempFilePathOptions {
  canvas: ShareCanvas
  x: number
  y: number
  width: number
  height: number
  destWidth: number
  destHeight: number
  fileType: 'png'
  quality: number
}
export interface ShareApi {
  getCanvas(id: string): Promise<ShareCanvas>
  toPngBlob(canvas: HTMLCanvasElement): Promise<Blob>
  download(blob: Blob, filename: string): void
  canvasToTempFilePath(options: ShareCanvasToTempFilePathOptions): Promise<{ tempFilePath: string }>
  chooseAction(items: readonly string[]): Promise<'preview' | 'save' | 'share-menu'>
  previewImage(options: { urls: string[]; current: string }): Promise<void>
  saveImageToPhotosAlbum(options: { filePath: string }): Promise<void>
  showShareImageMenu(options: { path: string }): Promise<void>
}
export interface ShareRequest {
  platform: 'h5' | 'weapp'
  canvasId: string
  api: ShareApi
  now?: () => number
  outputWidth?: number
  outputHeight?: number
}

export const shareImage = async ({ platform, canvasId, api, now = Date.now, outputWidth = 1200, outputHeight = 1800 }: ShareRequest): Promise<ShareResult> => {
  try {
    if (platform === 'h5') {
      const canvas = await api.getCanvas(canvasId)
      const blob = await api.toPngBlob(canvas as HTMLCanvasElement)
      api.download(blob, `hex-map-${now()}.png`)
      return { ok: true }
    }

    const canvas = await api.getCanvas(canvasId)
    const { tempFilePath } = await api.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: outputWidth,
      height: outputHeight,
      destWidth: outputWidth,
      destHeight: outputHeight,
      fileType: 'png',
      quality: 1,
    })
    const action = await api.chooseAction(['预览图片', '保存到相册', '发送给朋友'])
    if (action === 'preview') await api.previewImage({ urls: [tempFilePath], current: tempFilePath })
    else if (action === 'save') await api.saveImageToPhotosAlbum({ filePath: tempFilePath })
    else await api.showShareImageMenu({ path: tempFilePath })
    return { ok: true }
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'errMsg' in error ? String(error.errMsg) : String(error)
    if (message.includes('auth deny') || message.includes('auth denied')) return { ok: false, reason: 'album-permission' }
    if (message.includes('cancel')) return { ok: false, reason: 'cancelled' }
    return { ok: false, reason: platform === 'h5' ? 'download' : 'render' }
  }
}

const getCanvas2DNode = (id: string): Promise<ShareCanvas> => new Promise((resolve, reject) => {
  const query = (Taro as unknown as { createSelectorQuery?: () => CanvasSelectorQuery }).createSelectorQuery?.()
  if (!query) {
    reject(new Error('Canvas 2D selector query not available'))
    return
  }
  query
    .select(`#${id}`)
    .fields({ node: true, size: true })
    .exec((result) => {
      const canvas = result[0]?.node
      if (canvas) resolve(canvas)
      else reject(new Error(`Canvas node "${id}" not found`))
    })
})

export const createShareApi = (platform: 'h5' | 'weapp'): ShareApi => ({
  getCanvas: async (id) => {
    if (platform !== 'h5') return getCanvas2DNode(id)
    const canvas = document.getElementById(id)
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('share canvas not found')
    return canvas
  },
  toPngBlob: (canvas) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG render failed')), 'image/png')),
  download: (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
    URL.revokeObjectURL(url)
  },
  canvasToTempFilePath: (options) => {
    const canvasToTempFilePath = Taro.canvasToTempFilePath as unknown as (value: ShareCanvasToTempFilePathOptions) => Promise<{ tempFilePath: string }>
    return canvasToTempFilePath(options)
  },
  chooseAction: async (items) => {
    const { tapIndex } = await Taro.showActionSheet({ itemList: [...items] })
    if (tapIndex === 0) return 'preview'
    if (tapIndex === 1) return 'save'
    return 'share-menu'
  },
  previewImage: async (options) => { await Taro.previewImage(options) },
  saveImageToPhotosAlbum: async (options) => { await Taro.saveImageToPhotosAlbum(options) },
  showShareImageMenu: async (options) => { await Taro.showShareImageMenu(options) },
})
