import { layoutNextLine, type PreparedTextWithSegments, type LayoutCursor } from '@chenglou/pretext'
import {
  FONT,
  FONT_SIZE,
  LINE_HEIGHT,
  PADDING,
  MAX_CONTENT_WIDTH,
  REPEL_RADIUS,
  TEXT_COLOR,
} from './config'
import { circleXExtent } from './geometry'

const LINE_GAP = 6
const MIN_SIDE = FONT_SIZE * 3

export function drawArticleToTextCanvas(
  textCtx: CanvasRenderingContext2D,
  prepared: PreparedTextWithSegments,
  options: {
    W: number
    H: number
    scrollY: number
    obX: number
    obY: number
  }
): number {
  const { W, H, scrollY, obX, obY } = options
  textCtx.font = FONT
  textCtx.textBaseline = 'top'

  const contentWidth = Math.min(MAX_CONTENT_WIDTH, W - PADDING * 2)
  const contentLeft = (W - contentWidth) / 2
  const contentRight = contentLeft + contentWidth

  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = PADDING - scrollY

  const drawSegment = (text: string, x: number, textY: number) => {
    textCtx.fillStyle = TEXT_COLOR
    textCtx.fillText(text, x, textY)
  }

  while (true) {
    if (y > H + LINE_HEIGHT) break

    const lineTop = y
    const lineBottom = y + LINE_HEIGHT
    const textY = y + (LINE_HEIGHT - FONT_SIZE) / 2

    let circleXL = Infinity
    let circleXR = -Infinity
    let intersects = false

    for (let sampleY = lineTop; sampleY <= lineBottom; sampleY += LINE_HEIGHT / 4) {
      const extent = circleXExtent(obX, obY, REPEL_RADIUS, sampleY)
      if (!extent) continue
      intersects = true
      circleXL = Math.min(circleXL, extent[0])
      circleXR = Math.max(circleXR, extent[1])
    }

    circleXL = Math.max(circleXL, contentLeft)
    circleXR = Math.min(circleXR, contentRight)

    if (!intersects || circleXL >= circleXR) {
      const line = layoutNextLine(prepared, cursor, contentWidth)
      if (line === null) break
      if (y + LINE_HEIGHT > 0) drawSegment(line.text, contentLeft, textY)
      cursor = line.end
    } else {
      const spaceLeft = Math.max(0, Math.min(circleXL - LINE_GAP, contentRight) - contentLeft)
      const spaceRight = Math.max(0, contentRight - Math.max(circleXR + LINE_GAP, contentLeft))
      const hasLeft = spaceLeft >= MIN_SIDE
      const hasRight = spaceRight >= MIN_SIDE

      if (hasLeft && hasRight) {
        const leftLine = layoutNextLine(prepared, cursor, spaceLeft)
        if (leftLine === null) break
        if (y + LINE_HEIGHT > 0) drawSegment(leftLine.text, contentLeft, textY)

        const rightLine = layoutNextLine(prepared, leftLine.end, spaceRight)
        if (rightLine !== null) {
          const rightX = Math.max(circleXR + LINE_GAP, contentLeft)
          if (y + LINE_HEIGHT > 0) drawSegment(rightLine.text, rightX, textY)
          cursor = rightLine.end
        } else {
          cursor = leftLine.end
        }
      } else if (hasLeft) {
        const line = layoutNextLine(prepared, cursor, spaceLeft)
        if (line === null) break
        if (y + LINE_HEIGHT > 0) drawSegment(line.text, contentLeft, textY)
        cursor = line.end
      } else if (hasRight) {
        const rightX = Math.max(circleXR + LINE_GAP, contentLeft)
        const line = layoutNextLine(prepared, cursor, spaceRight)
        if (line === null) break
        if (y + LINE_HEIGHT > 0) drawSegment(line.text, rightX, textY)
        cursor = line.end
      } else {
        y += LINE_HEIGHT
        continue
      }
    }

    y += LINE_HEIGHT
  }

  return y
}
