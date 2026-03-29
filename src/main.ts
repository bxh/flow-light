import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext'
import { FONT, PADDING } from './config'
import { ARTICLE } from './article'
import { initAudioGestureUnlock, playScrollTick, tickMotionAudio } from './audio'
import { drawArticleToTextCanvas } from './text-layout'
import { drawBlackHoleAndWarpedText } from './warp-composite'

initAudioGestureUnlock()

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

const textCanvas = document.createElement('canvas')
const textCtx = textCanvas.getContext('2d')!

let dpr = window.devicePixelRatio || 1
let W = 0
let H = 0
let mouseX = -9999
let mouseY = -9999
let scrollY = 0
let targetScrollY = 0

let smoothMouseX = -9999
let smoothMouseY = -9999

let prepared: PreparedTextWithSegments | null = null

function resize() {
  dpr = window.devicePixelRatio || 1
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  textCanvas.width = W * dpr
  textCanvas.height = H * dpr
  textCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function prepareText() {
  prepared = prepareWithSegments(ARTICLE, FONT)
}

function draw() {
  if (!prepared) return

  ctx.clearRect(0, 0, W, H)
  textCtx.clearRect(0, 0, W, H)

  smoothMouseX += (mouseX - smoothMouseX) * 0.25
  smoothMouseY += (mouseY - smoothMouseY) * 0.25

  scrollY += (targetScrollY - scrollY) * 0.15

  tickMotionAudio(smoothMouseX, smoothMouseY)

  const obX = smoothMouseX
  const obY = smoothMouseY

  const layoutEndY = drawArticleToTextCanvas(textCtx, prepared, {
    W,
    H,
    scrollY,
    obX,
    obY,
  })

  const totalHeight = layoutEndY + scrollY - PADDING + PADDING * 2
  const maxScroll = Math.max(0, totalHeight - H)
  targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll))

  drawBlackHoleAndWarpedText(ctx, textCanvas, {
    W,
    H,
    dpr,
    obX,
    obY,
  })

  requestAnimationFrame(draw)
}

window.addEventListener('resize', resize)

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
})

window.addEventListener('wheel', (e) => {
  e.preventDefault()
  targetScrollY += e.deltaY
  playScrollTick(e.deltaY)
}, { passive: false })

let lastTouchY = 0
window.addEventListener('touchstart', (e) => {
  lastTouchY = e.touches[0].clientY
  mouseX = e.touches[0].clientX
  mouseY = e.touches[0].clientY
})

window.addEventListener('touchmove', (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const dy = touch.clientY - lastTouchY
  mouseX = touch.clientX
  mouseY = touch.clientY
  targetScrollY -= dy
  playScrollTick(-dy * 2.5)
  lastTouchY = touch.clientY
}, { passive: false })

resize()
prepareText()
requestAnimationFrame(draw)
