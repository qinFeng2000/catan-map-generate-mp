import { describe, expect, it, vi } from 'vitest'
import { executeCommands } from '@/renderer/canvas-executor'
import type { DrawCommand } from '@/renderer/commands'

const contextFixture = () => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  draw: vi.fn(),
})

describe('executeCommands', () => {
  it('draws commands with the standard Canvas 2D context synchronously', async () => {
    const context = contextFixture()
    const commands: DrawCommand[] = [
      { kind: 'clear', width: 100, height: 80, color: '#ffffff' },
      { kind: 'polygon', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }], fill: '#111111', stroke: '#222222', lineWidth: 2 },
      { kind: 'text', at: { x: 10, y: 12 }, text: '6', color: '#c83a2f', fontSize: 24, weight: 'bold', align: 'center' },
    ]

    await executeCommands(context, commands)

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 80)
    expect(context.moveTo).toHaveBeenCalledWith(1, 2)
    expect(context.lineTo).toHaveBeenCalledWith(3, 4)
    expect(context.lineTo).toHaveBeenCalledWith(5, 6)
    expect(context.fillText).toHaveBeenCalledWith('6', 10, 12)
    expect(context.font).toBe('bold 24px sans-serif')
    expect(context.textAlign).toBe('center')
    expect(context.textBaseline).toBe('middle')
    expect(context.draw).not.toHaveBeenCalled()
  })
})
