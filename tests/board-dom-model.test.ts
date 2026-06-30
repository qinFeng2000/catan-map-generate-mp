import { describe, expect, it } from 'vitest'
import { createBoardDomScene } from '@/components/BoardDom/model'
import type { DrawCommand } from '@/renderer/commands'

const hexAt = (centerX: number, centerY: number, tag: 'land-hex' | 'sea-hex', fill: string): DrawCommand => ({
  kind: 'polygon',
  points: [
    { x: centerX, y: centerY - 20 },
    { x: centerX + 20, y: centerY - 10 },
    { x: centerX + 20, y: centerY + 10 },
    { x: centerX, y: centerY + 20 },
    { x: centerX - 20, y: centerY + 10 },
    { x: centerX - 20, y: centerY - 10 },
  ],
  fill,
  stroke: fill,
  lineWidth: 1,
  tag,
})

const commands: DrawCommand[] = [
  { kind: 'clear', color: '#f7f4ec', width: 200, height: 100 },
  hexAt(100, 50, 'land-hex', '#3f8f4b'),
  hexAt(30, 50, 'sea-hex', '#69a9d2'),
  {
    kind: 'polygon',
    points: [{ x: 30, y: 50 }, { x: 20, y: 40 }, { x: 20, y: 60 }],
    fill: '#ead8a8',
    stroke: '#ead8a8',
    lineWidth: 0,
    tag: 'harbor-opening',
  },
  { kind: 'circle', center: { x: 100, y: 50 }, radius: 8, fill: '#fff7dd', stroke: '#fff7dd', lineWidth: 0, tag: 'number-token' },
  { kind: 'text', at: { x: 100, y: 50 }, text: '8', color: '#c83a2f', fontSize: 10, weight: 'bold', align: 'center', tag: 'number-text' },
  {
    kind: 'polygon',
    points: [{ x: 10, y: 5 }, { x: 20, y: 5 }, { x: 20, y: 15 }, { x: 10, y: 15 }],
    fill: '#3f8f4b',
    stroke: '#3f8f4b',
    lineWidth: 0,
    tag: 'resource-legend-swatch',
  },
  { kind: 'text', at: { x: 25, y: 10 }, text: '木材', color: '#29333a', fontSize: 8, weight: 'bold', align: 'left', tag: 'resource-legend-label' },
]

describe('createBoardDomScene', () => {
  it('uses the clear command as background and preserves command layer order', () => {
    const scene = createBoardDomScene(commands, 200, 100, 400)

    expect(scene.background).toBe('#f7f4ec')
    expect(scene.layers).toHaveLength(commands.length - 1)
    expect(scene.layers.map((layer) => layer.tag)).toEqual([
      'land-hex', 'sea-hex', 'harbor-opening', 'number-token', 'number-text',
      'resource-legend-swatch', 'resource-legend-label',
    ])
  })

  it('positions polygons with percentage bounds and a local clip path', () => {
    const scene = createBoardDomScene(commands, 200, 100, 400)
    const land = scene.layers.find((layer) => layer.tag === 'land-hex')!

    expect(land.kind).toBe('polygon')
    expect(land.style).toMatchObject({
      left: '40%',
      top: '30%',
      width: '20%',
      height: '40%',
      backgroundColor: '#3f8f4b',
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    })
  })

  it('preserves circle and text presentation', () => {
    const scene = createBoardDomScene(commands, 200, 100, 400)
    const token = scene.layers.find((layer) => layer.tag === 'number-token')!
    const number = scene.layers.find((layer) => layer.tag === 'number-text')!

    expect(token.style).toMatchObject({ left: '46%', top: '42%', width: '8%', height: '16%', borderRadius: '50%', backgroundColor: '#fff7dd' })
    expect(number).toMatchObject({ kind: 'text', text: '8' })
    expect(number.style).toMatchObject({ left: '50%', top: '50%', color: '#c83a2f', fontSize: '20rpx', fontWeight: 'bold', transform: 'translate(-50%, -50%)' })
  })

  it('reveals tiles outward and synchronizes their attached details', () => {
    const scene = createBoardDomScene(commands, 200, 100, 400)
    const land = scene.layers.find((layer) => layer.tag === 'land-hex')!
    const sea = scene.layers.find((layer) => layer.tag === 'sea-hex')!
    const harbor = scene.layers.find((layer) => layer.tag === 'harbor-opening')!
    const token = scene.layers.find((layer) => layer.tag === 'number-token')!
    const number = scene.layers.find((layer) => layer.tag === 'number-text')!

    expect(land.revealRole).toBe('tile')
    expect(sea.revealRole).toBe('tile')
    expect(token).toMatchObject({ revealRole: 'detail', revealDelayMs: land.revealDelayMs })
    expect(number).toMatchObject({ revealRole: 'detail', revealDelayMs: land.revealDelayMs })
    expect(harbor).toMatchObject({ revealRole: 'detail', revealDelayMs: sea.revealDelayMs })
  })

  it('measures reveal distance from the map center instead of the canvas center', () => {
    const shiftedMap: DrawCommand[] = [
      { kind: 'clear', color: '#ffffff', width: 200, height: 120 },
      hexAt(30, 80, 'sea-hex', '#69a9d2'),
      hexAt(100, 80, 'land-hex', '#3f8f4b'),
      hexAt(170, 80, 'sea-hex', '#69a9d2'),
    ]

    const scene = createBoardDomScene(shiftedMap, 200, 120, 400)
    const center = scene.layers.find((layer) => layer.tag === 'land-hex')!
    const edges = scene.layers.filter((layer) => layer.tag === 'sea-hex')

    expect(center.revealDelayMs).toBe(0)
    expect(edges.every((layer) => layer.revealDelayMs === 420)).toBe(true)
  })

  it('leaves legend layers outside the staggered reveal', () => {
    const scene = createBoardDomScene(commands, 200, 100, 400)
    const legend = scene.layers.filter((layer) => layer.tag?.startsWith('resource-legend'))

    expect(legend).toHaveLength(2)
    expect(legend.every((layer) => layer.revealRole === undefined && layer.revealDelayMs === undefined)).toBe(true)
  })
})
