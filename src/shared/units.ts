import Taro from '@tarojs/taro'

/** 750 设计稿尺寸，输出各端自适应单位（小程序为 rpx） */
export const rpx = (designPx: number): string => Taro.pxTransform(designPx)

export const PAGE_HORIZONTAL_PADDING = 48
export const MAX_CANVAS_WIDTH = 686

interface RuntimeSizingApi {
  getWindowInfo?: () => { windowWidth?: number; pixelRatio?: number }
  getDeviceInfo?: () => { pixelRatio?: number }
  getSystemInfoSync?: () => { windowWidth?: number; pixelRatio?: number }
}

const runtimeSizingApi = (): RuntimeSizingApi => Taro as unknown as RuntimeSizingApi
const wechatSizingApi = (): RuntimeSizingApi => (globalThis as unknown as { wx?: RuntimeSizingApi }).wx ?? {}

const readWindowInfo = (): { windowWidth?: number; pixelRatio?: number } => {
  try {
    return runtimeSizingApi().getWindowInfo?.() ?? wechatSizingApi().getWindowInfo?.() ?? {}
  } catch {
    return {}
  }
}

const readDeviceInfo = (): { pixelRatio?: number } => {
  try {
    return runtimeSizingApi().getDeviceInfo?.() ?? wechatSizingApi().getDeviceInfo?.() ?? {}
  } catch {
    return {}
  }
}

const readLegacySystemInfo = (): { windowWidth?: number; pixelRatio?: number } => {
  try {
    return runtimeSizingApi().getSystemInfoSync?.() ?? wechatSizingApi().getSystemInfoSync?.() ?? {}
  } catch {
    return {}
  }
}

export const getRuntimeWindowWidth = (): number => {
  return readWindowInfo().windowWidth ?? readLegacySystemInfo().windowWidth ?? 375
}

export const getRuntimePixelRatio = (): number => {
  return readWindowInfo().pixelRatio ?? readDeviceInfo().pixelRatio ?? readLegacySystemInfo().pixelRatio ?? 1
}

/** 按 750 设计稿计算页面地图可用宽度 */
export const getDesignCanvasWidth = (
  horizontalPadding = PAGE_HORIZONTAL_PADDING,
  maxWidth = MAX_CANVAS_WIDTH,
): number => Math.min(maxWidth, Math.max(320, 750 - horizontalPadding))

/** 页面交互 Canvas 使用显示像素坐标，避免旧 CanvasContext 被 rpx/DPR 坐标裁切 */
export const toDisplayCanvasSize = (
  designWidth: number,
  designHeight: number,
  windowWidth = getRuntimeWindowWidth(),
  scale = 2,
): { width: number; height: number } => {
  const factor = (windowWidth / 750) * scale
  return {
    width: Math.max(1, Math.round(designWidth * factor)),
    height: Math.max(1, Math.round(designHeight * factor)),
  }
}

/** 设计稿坐标 → 当前设备 Canvas 绘制像素（与 rpx 显示尺寸一致） */
export const toCanvasPixelSize = (
  designWidth: number,
  designHeight: number,
  windowWidth = getRuntimeWindowWidth(),
  pixelRatio = getRuntimePixelRatio(),
): { width: number; height: number } => {
  const factor = (windowWidth / 750) * pixelRatio
  return {
    width: Math.max(1, Math.round(designWidth * factor)),
    height: Math.max(1, Math.round(designHeight * factor)),
  }
}
