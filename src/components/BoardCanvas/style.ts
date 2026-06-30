import { rpx } from '@/shared/units'

interface BoardCanvasStyleOptions {
  designWidth: number
  designHeight: number
  renderWidth: number
  renderHeight: number
  offscreen: boolean
}

export const boardCanvasStyle = ({ designWidth, designHeight, renderWidth, renderHeight, offscreen }: BoardCanvasStyleOptions): { width: string; height: string } => {
  if (offscreen) return { width: `${renderWidth}px`, height: `${renderHeight}px` }
  return { width: rpx(designWidth), height: rpx(designHeight) }
}
