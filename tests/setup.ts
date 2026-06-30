import { vi } from 'vitest'

Object.assign(globalThis, {
  ENABLE_INNER_HTML: true,
  ENABLE_ADJACENT_HTML: true,
  ENABLE_SIZE_APIS: true,
  ENABLE_TEMPLATE_CONTENT: true,
  ENABLE_CLONE_NODE: true,
  ENABLE_CONTAINS: true,
  ENABLE_MUTATION_OBSERVER: true,
})

globalThis.defineAppConfig = <T>(config: T): T => config
globalThis.definePageConfig = <T>(config: T): T => config

vi.mock('@tarojs/taro', () => ({
  default: {
    pxTransform: vi.fn((value: number) => `${value}rpx`),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    createCanvasContext: vi.fn(() => ({
      setFillStyle: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      setStrokeStyle: vi.fn(),
      setLineWidth: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      setFontSize: vi.fn(),
      setTextAlign: vi.fn(),
      setTextBaseline: vi.fn(),
      fillText: vi.fn(),
      draw: vi.fn((_reserve: boolean, cb?: () => void) => cb?.()),
    })),
    canvasToTempFilePath: vi.fn(async () => ({ tempFilePath: '/tmp/map.png' })),
    showActionSheet: vi.fn(async () => ({ tapIndex: 1 })),
    previewImage: vi.fn(async () => undefined),
    saveImageToPhotosAlbum: vi.fn(async () => undefined),
    showShareImageMenu: vi.fn(async () => undefined),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showModal: vi.fn(async () => ({ confirm: true })),
    openSetting: vi.fn(async () => undefined),
  },
}))
