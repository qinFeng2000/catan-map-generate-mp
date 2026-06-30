import { Canvas, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import type { DrawCommand } from '@/renderer/commands'
import { scheduleCanvasDraw } from './draw'
import { boardCanvasStyle } from './style'
import './index.scss'

interface Props {
  canvasId: string
  commands: readonly DrawCommand[]
  designWidth: number
  designHeight: number
  renderWidth: number
  renderHeight: number
  offscreen?: boolean
  onDrawn?: () => void
}

export function BoardCanvas({ canvasId, commands, designWidth, designHeight, renderWidth, renderHeight, offscreen = false, onDrawn }: Props) {
  useEffect(() => {
    return scheduleCanvasDraw(Taro, canvasId, renderWidth, renderHeight, commands, onDrawn)
  }, [canvasId, commands, onDrawn, renderHeight, renderWidth])
  const canvasWidth = String(renderWidth)
  const canvasHeight = String(renderHeight)
  const displayStyle = boardCanvasStyle({ designWidth, designHeight, renderWidth, renderHeight, offscreen })

  if (offscreen) {
    return (
      <View className='share-canvas-host' aria-hidden style={displayStyle}>
        <Canvas
          canvasId={canvasId}
          id={canvasId}
          type='2d'
          className='share-canvas'
          width={canvasWidth}
          height={canvasHeight}
          style={displayStyle}
        />
      </View>
    )
  }

  return (
    <Canvas
      canvasId={canvasId}
      id={canvasId}
      type='2d'
      className='board-canvas'
      width={canvasWidth}
      height={canvasHeight}
      style={displayStyle}
    />
  )
}
