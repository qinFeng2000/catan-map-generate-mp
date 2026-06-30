import { coordKey, type HexCoord } from '@/domain/board'
import { addHex, HEX_DIRECTIONS, hexCorners, type Point } from './hex'

export interface Intersection { key: string; point: Point; hexKeys: readonly string[] }
export interface BoardTopology {
  neighbors: ReadonlyMap<string, readonly string[]>
  intersections: readonly Intersection[]
  intersectionsByHex: ReadonlyMap<string, readonly string[]>
  coastalHexKeys: ReadonlySet<string>
}

const pointKey = ({ x, y }: Point): string => `${Math.round(x * 1_000_000)},${Math.round(y * 1_000_000)}`

export const buildTopology = (coords: readonly HexCoord[]): BoardTopology => {
  const coordByKey = new Map(coords.map((coord) => [coordKey(coord), coord]))
  const neighbors = new Map<string, string[]>()
  const intersectionMap = new Map<string, { point: Point; hexKeys: string[] }>()
  const intersectionsByHex = new Map<string, string[]>()
  const coastalHexKeys = new Set<string>()

  for (const coord of coords) {
    const key = coordKey(coord)
    const adjacent = HEX_DIRECTIONS.map((direction) => coordKey(addHex(coord, direction))).filter((neighbor) => coordByKey.has(neighbor))
    neighbors.set(key, adjacent)
    if (adjacent.length < 6) coastalHexKeys.add(key)

    const keys = hexCorners(coord, 1).map((point) => {
      const vertexKey = pointKey(point)
      const entry = intersectionMap.get(vertexKey) ?? { point, hexKeys: [] }
      if (!entry.hexKeys.includes(key)) entry.hexKeys.push(key)
      intersectionMap.set(vertexKey, entry)
      return vertexKey
    })
    intersectionsByHex.set(key, keys)
  }

  return {
    neighbors,
    intersections: [...intersectionMap].map(([key, value]) => ({ key, ...value })),
    intersectionsByHex,
    coastalHexKeys,
  }
}
