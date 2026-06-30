import type { DrawCommand } from './commands'

export interface Canvas2DContext {
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  fillRect: (x: number, y: number, w: number, h: number) => void
  beginPath: () => void
  moveTo: (x: number, y: number) => void
  lineTo: (x: number, y: number) => void
  closePath: () => void
  fill: () => void
  stroke: () => void
  arc: (x: number, y: number, radius: number, startAngle: number, endAngle: number) => void
  fillText: (text: string, x: number, y: number) => void
}

export const executeCommands = (
  context: Canvas2DContext,
  commands: readonly DrawCommand[],
): Promise<void> => {
  for (const command of commands) {
    if (command.kind === 'clear') {
      context.fillStyle = command.color; context.fillRect(0, 0, command.width, command.height); continue
    }
    if (command.kind === 'polygon') {
      context.beginPath(); context.moveTo(command.points[0]!.x, command.points[0]!.y)
      command.points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
      context.closePath(); context.fillStyle = command.fill; context.fill()
      context.strokeStyle = command.stroke; context.lineWidth = command.lineWidth; context.stroke(); continue
    }
    if (command.kind === 'line') {
      context.beginPath(); context.moveTo(command.from.x, command.from.y); context.lineTo(command.to.x, command.to.y)
      context.strokeStyle = command.color; context.lineWidth = command.lineWidth; context.stroke(); continue
    }
    if (command.kind === 'circle') {
      context.beginPath(); context.arc(command.center.x, command.center.y, command.radius, 0, Math.PI * 2)
      context.fillStyle = command.fill; context.fill(); context.strokeStyle = command.stroke; context.lineWidth = command.lineWidth; context.stroke(); continue
    }
    context.fillStyle = command.color; context.font = `${command.weight} ${command.fontSize}px sans-serif`
    context.textAlign = command.align; context.textBaseline = 'middle'; context.fillText(command.text, command.at.x, command.at.y)
  }
  return Promise.resolve()
}
