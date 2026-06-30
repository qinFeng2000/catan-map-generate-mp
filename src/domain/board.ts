export type BoardVersion = 'base' | 'extension'
export type ProductiveResource = 'wood' | 'wool' | 'grain' | 'brick' | 'ore'
export type Resource = ProductiveResource | 'desert'
export type NumberToken = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12
export type HexEdge = 0 | 1 | 2 | 3 | 4 | 5

export interface HexCoord { q: number; r: number }
export interface LandHex { id: string; coord: HexCoord; resource: Resource; number: NumberToken | null }
export interface HarborPreset { id: string; sea: HexCoord; kind: 'generic' | 'resource'; resource?: ProductiveResource; facingEdge: HexEdge }
export interface BoardPreset {
  version: BoardVersion
  landCoords: readonly HexCoord[]
  seaCoords: readonly HexCoord[]
  resourceBag: readonly Resource[]
  numberBag: readonly NumberToken[]
  harbors: readonly HarborPreset[]
  diameter: number
}
export interface BoardMetrics {
  sameNumberMinDistance: number
  resourcePipRange: number
  intersectionMaxPips: number
  intersectionPipRange: number
  intersectionStdDev: number
  woodBrickSharedPips: number
  normalizedScore: number
}
export interface GeneratedBoard {
  version: BoardVersion
  hexes: readonly LandHex[]
  metrics: BoardMetrics
  seed: number
  createdAt: number
}

export const PRODUCTIVE_RESOURCES: readonly ProductiveResource[] = ['wood', 'wool', 'grain', 'brick', 'ore']
export const isProductiveResource = (resource: Resource): resource is ProductiveResource => resource !== 'desert'
export const coordKey = ({ q, r }: HexCoord): string => `${q},${r}`
