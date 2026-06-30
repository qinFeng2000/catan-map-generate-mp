import type { Point } from '@/geometry/hex'

interface Tagged { tag?: string }
export type DrawCommand =
  | ({ kind: 'clear'; color: string; width: number; height: number } & Tagged)
  | ({ kind: 'polygon'; points: readonly Point[]; fill: string; stroke: string; lineWidth: number } & Tagged)
  | ({ kind: 'line'; from: Point; to: Point; color: string; lineWidth: number } & Tagged)
  | ({ kind: 'circle'; center: Point; radius: number; fill: string; stroke: string; lineWidth: number } & Tagged)
  | ({ kind: 'text'; at: Point; text: string; color: string; fontSize: number; weight: 'normal' | 'bold'; align: 'left' | 'center' | 'right' } & Tagged)
