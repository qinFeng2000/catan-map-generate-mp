import type { Point } from '@/geometry/hex'
import type { DrawCommand } from '@/renderer/commands'
import { rpx } from '@/shared/units'

export type BoardDomLayerKind = 'polygon' | 'circle' | 'text'
export type BoardDomRevealRole = 'tile' | 'detail'

export interface BoardDomLayer {
  key: string
  kind: BoardDomLayerKind
  tag?: string
  text?: string
  style: Record<string, string | number>
  revealRole?: BoardDomRevealRole
  revealDelayMs?: number
}

export interface BoardDomScene {
  background: string
  layers: readonly BoardDomLayer[]
}

interface TileAnchor {
  center: Point
  delayMs: number
}

const TILE_TAGS = new Set(['sea-hex', 'land-hex'])
const DETAIL_TAGS = new Set(['harbor-opening', 'number-token', 'number-text'])
const MAX_REVEAL_DELAY_MS = 420
const TILE_OVERLAP_RENDER_PX = 1

const rounded = (value: number): number => Math.round(value * 10000) / 10000
const percent = (value: number, total: number): string => `${rounded((value / total) * 100)}%`

const polygonBounds = (points: readonly Point[]) => {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

const polygonCenter = (points: readonly Point[]): Point => {
  const bounds = polygonBounds(points)
  return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 }
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

const expandPolygon = (points: readonly Point[], amount: number): Point[] => {
  const center = polygonCenter(points)
  const radius = Math.max(0, ...points.map((point) => distance(point, center)))
  if (radius === 0) return [...points]
  const scale = (radius + amount) / radius
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }))
}

const createTileAnchors = (commands: readonly DrawCommand[]): TileAnchor[] => {
  const centers = commands
    .filter((command): command is Extract<DrawCommand, { kind: 'polygon' }> => command.kind === 'polygon' && TILE_TAGS.has(command.tag ?? ''))
    .map((command) => polygonCenter(command.points))
  const xs = centers.map((center) => center.x)
  const ys = centers.map((center) => center.y)
  const mapCenter = centers.length === 0
    ? { x: 0, y: 0 }
    : { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
  const maxDistance = Math.max(0, ...centers.map((center) => distance(center, mapCenter)))
  return centers.map((center) => ({
    center,
    delayMs: maxDistance === 0 ? 0 : Math.round((distance(center, mapCenter) / maxDistance) * MAX_REVEAL_DELAY_MS),
  }))
}

const nearestTileDelay = (point: Point, anchors: readonly TileAnchor[]): number => {
  const nearest = anchors.reduce<TileAnchor | undefined>((selected, candidate) => {
    if (!selected) return candidate
    return distance(point, candidate.center) < distance(point, selected.center) ? candidate : selected
  }, undefined)
  return nearest?.delayMs ?? 0
}

const polygonStyle = (command: Extract<DrawCommand, { kind: 'polygon' }>, width: number, height: number) => {
  const points = TILE_TAGS.has(command.tag ?? '')
    ? expandPolygon(command.points, TILE_OVERLAP_RENDER_PX)
    : command.points
  const bounds = polygonBounds(points)
  const localPoint = (point: Point): string => {
    const x = bounds.width === 0 ? 0 : ((point.x - bounds.left) / bounds.width) * 100
    const y = bounds.height === 0 ? 0 : ((point.y - bounds.top) / bounds.height) * 100
    return `${rounded(x)}% ${rounded(y)}%`
  }
  return {
    left: percent(bounds.left, width),
    top: percent(bounds.top, height),
    width: percent(bounds.width, width),
    height: percent(bounds.height, height),
    backgroundColor: command.fill,
    clipPath: `polygon(${points.map(localPoint).join(', ')})`,
  }
}

const circleStyle = (command: Extract<DrawCommand, { kind: 'circle' }>, width: number, height: number) => ({
  left: percent(command.center.x - command.radius, width),
  top: percent(command.center.y - command.radius, height),
  width: percent(command.radius * 2, width),
  height: percent(command.radius * 2, height),
  borderRadius: '50%',
  backgroundColor: command.fill,
})

const textStyle = (
  command: Extract<DrawCommand, { kind: 'text' }>,
  width: number,
  height: number,
  designWidth: number,
) => ({
  left: percent(command.at.x, width),
  top: percent(command.at.y, height),
  color: command.color,
  fontSize: rpx(command.fontSize * designWidth / width),
  fontWeight: command.weight,
  textAlign: command.align,
  transform: command.align === 'left'
    ? 'translate(0, -50%)'
    : command.align === 'right'
      ? 'translate(-100%, -50%)'
      : 'translate(-50%, -50%)',
})

const commandAnchor = (command: DrawCommand): Point | null => {
  if (command.kind === 'circle') return command.center
  if (command.kind === 'text') return command.at
  if (command.kind === 'polygon') return command.tag === 'harbor-opening' ? command.points[0] ?? null : polygonCenter(command.points)
  return null
}

export const createBoardDomScene = (
  commands: readonly DrawCommand[],
  width: number,
  height: number,
  designWidth: number,
): BoardDomScene => {
  const anchors = createTileAnchors(commands)
  const background = commands.find((command) => command.kind === 'clear')?.color ?? 'transparent'
  const layers: BoardDomLayer[] = []

  commands.forEach((command, index) => {
    if (command.kind === 'clear' || command.kind === 'line') return
    const revealRole: BoardDomRevealRole | undefined = TILE_TAGS.has(command.tag ?? '')
      ? 'tile'
      : DETAIL_TAGS.has(command.tag ?? '')
        ? 'detail'
        : undefined
    const anchor = commandAnchor(command)
    const revealDelayMs = revealRole && anchor ? nearestTileDelay(anchor, anchors) : undefined
    const common = {
      key: `${command.tag ?? command.kind}-${index}`,
      tag: command.tag,
      revealRole,
      revealDelayMs,
    }

    if (command.kind === 'polygon') {
      layers.push({ ...common, kind: 'polygon', style: polygonStyle(command, width, height) })
      return
    }
    if (command.kind === 'circle') {
      layers.push({ ...common, kind: 'circle', style: circleStyle(command, width, height) })
      return
    }
    layers.push({ ...common, kind: 'text', text: command.text, style: textStyle(command, width, height, designWidth) })
  })

  return { background, layers }
}
