import type { HexCoord, HexEdge } from '@/domain/board'

export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
]

export interface Point { x: number; y: number }
export const addHex = (a: HexCoord, b: HexCoord): HexCoord => ({ q: a.q + b.q, r: a.r + b.r })
export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  const dq = a.q - b.q
  const dr = a.r - b.r
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}
export const hexToPoint = ({ q, r }: HexCoord, size: number): Point => ({
  x: Math.sqrt(3) * size * (q + r / 2),
  y: 1.5 * size * r,
})
export const hexCorners = (coord: HexCoord, size: number): Point[] => {
  const center = hexToPoint(coord, size)
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((-90 + index * 60) * Math.PI) / 180
    return { x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) }
  })
}
export const edgeEndpoints = (coord: HexCoord, size: number, edge: HexEdge): [Point, Point] => {
  const center = hexToPoint(coord, size)
  const directionAngle = (-60 * edge * Math.PI) / 180
  const pointAt = (angle: number): Point => ({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) })
  return [pointAt(directionAngle - Math.PI / 6), pointAt(directionAngle + Math.PI / 6)]
}

/** 港口临陆边的开口三角：中心 + 该边两端点 */
export const harborOpeningTriangle = (coord: HexCoord, size: number, edge: HexEdge): [Point, Point, Point] => {
  const center = hexToPoint(coord, size)
  const [left, right] = edgeEndpoints(coord, size, edge)
  return [center, left, right]
}
