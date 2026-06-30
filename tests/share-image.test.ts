import { describe, expect, it, vi } from 'vitest'
import { shareImage, type ShareApi, type ShareCanvas } from '@/sharing/share-image'

const canvasFixture = {} as ShareCanvas
const apiFixture = (): ShareApi => ({
  getCanvas: vi.fn(async () => canvasFixture),
  toPngBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  download: vi.fn(),
  canvasToTempFilePath: vi.fn(async () => ({ tempFilePath: '/tmp/map.png' })),
  chooseAction: vi.fn(async () => 'save' as const),
  previewImage: vi.fn(async () => undefined),
  saveImageToPhotosAlbum: vi.fn(async () => undefined),
  showShareImageMenu: vi.fn(async () => undefined),
})

describe('shareImage', () => {
  it('downloads a PNG on H5', async () => {
    const api = apiFixture()
    await shareImage({ platform: 'h5', canvasId: 'share-canvas', api })
    expect(api.download).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/\.png$/))
  })

  it('offers preview and explicit save on WeChat', async () => {
    const api = apiFixture()
    await shareImage({ platform: 'weapp', canvasId: 'share-canvas', api, outputWidth: 1600, outputHeight: 2200 })
    expect(api.canvasToTempFilePath).toHaveBeenCalledWith({
      canvas: canvasFixture,
      x: 0,
      y: 0,
      width: 1600,
      height: 2200,
      destWidth: 1600,
      destHeight: 2200,
      fileType: 'png',
      quality: 1,
    })
    expect(api.saveImageToPhotosAlbum).toHaveBeenCalled()
  })

  it('opens showShareImageMenu when the user picks WeChat share', async () => {
    const api = apiFixture()
    vi.mocked(api.chooseAction).mockResolvedValue('share-menu')
    await shareImage({ platform: 'weapp', canvasId: 'share-canvas', api })
    expect(api.showShareImageMenu).toHaveBeenCalledWith({ path: '/tmp/map.png' })
    expect(api.saveImageToPhotosAlbum).not.toHaveBeenCalled()
    expect(api.previewImage).not.toHaveBeenCalled()
  })

  it('returns a recoverable permission result when album access is denied', async () => {
    const api = apiFixture()
    vi.mocked(api.saveImageToPhotosAlbum).mockRejectedValue({ errMsg: 'saveImageToPhotosAlbum:fail auth deny' })
    const result = await shareImage({ platform: 'weapp', canvasId: 'share-canvas', api })
    expect(result).toEqual({ ok: false, reason: 'album-permission' })
  })
})
