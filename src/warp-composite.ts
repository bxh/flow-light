import { OBSTACLE_RADIUS, WARP_RADIUS, WARP_STRENGTH, TILE } from './config'

export function drawBlackHoleAndWarpedText(
  ctx: CanvasRenderingContext2D,
  textCanvas: HTMLCanvasElement,
  options: {
    W: number
    H: number
    dpr: number
    obX: number
    obY: number
  }
): void {
  const { W, H, dpr, obX, obY } = options

  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(obX, obY, OBSTACLE_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  const warpL = Math.max(0, Math.floor((obX - WARP_RADIUS) / TILE) * TILE)
  const warpR = Math.min(W, Math.ceil((obX + WARP_RADIUS) / TILE) * TILE)
  const warpT = Math.max(0, Math.floor((obY - WARP_RADIUS) / TILE) * TILE)
  const warpB = Math.min(H, Math.ceil((obY + WARP_RADIUS) / TILE) * TILE)

  if (warpT > 0)
    ctx.drawImage(textCanvas, 0, 0, W * dpr, warpT * dpr, 0, 0, W, warpT)
  if (warpB < H)
    ctx.drawImage(textCanvas, 0, warpB * dpr, W * dpr, (H - warpB) * dpr, 0, warpB, W, H - warpB)
  if (warpL > 0)
    ctx.drawImage(textCanvas, 0, warpT * dpr, warpL * dpr, (warpB - warpT) * dpr, 0, warpT, warpL, warpB - warpT)
  if (warpR < W)
    ctx.drawImage(textCanvas, warpR * dpr, warpT * dpr, (W - warpR) * dpr, (warpB - warpT) * dpr, warpR, warpT, W - warpR, warpB - warpT)

  for (let ty = warpT; ty < warpB; ty += TILE) {
    for (let tx = warpL; tx < warpR; tx += TILE) {
      const cx = tx + TILE / 2
      const cy = ty + TILE / 2
      const dx = cx - obX
      const dy = cy - obY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > WARP_RADIUS) {
        ctx.drawImage(textCanvas, tx * dpr, ty * dpr, TILE * dpr, TILE * dpr, tx, ty, TILE, TILE)
        continue
      }

      if (dist < OBSTACLE_RADIUS * 0.95) continue

      const normDist = dist / WARP_RADIUS
      const falloff = 1 - normDist
      const displacement = WARP_STRENGTH * falloff * falloff / Math.max(dist, 1)
      const angle = Math.atan2(dy, dx)

      const srcX = tx + Math.cos(angle) * displacement
      const srcY = ty + Math.sin(angle) * displacement

      const stretch = 1 + displacement * 0.008

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.scale(Math.max(0.3, 1 - displacement * 0.004), stretch)
      ctx.rotate(-angle)
      ctx.translate(-cx, -cy)

      ctx.drawImage(
        textCanvas,
        srcX * dpr, srcY * dpr, TILE * dpr, TILE * dpr,
        tx, ty, TILE, TILE
      )
      ctx.restore()
    }
  }
}
