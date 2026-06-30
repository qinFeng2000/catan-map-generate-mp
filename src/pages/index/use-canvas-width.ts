import { useEffect, useState } from 'react'
import { getDesignCanvasWidth } from '@/shared/units'

export const useCanvasWidth = (): number => {
  const [width, setWidth] = useState(() => getDesignCanvasWidth())

  useEffect(() => {
    setWidth(getDesignCanvasWidth())
  }, [])

  return width
}
