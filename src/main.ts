import { prepareWithSegments, layoutNextLine, type PreparedTextWithSegments, type LayoutCursor } from '@chenglou/pretext'

const ARTICLE = `The universe is under no obligation to make sense to you. Yet here we are, pattern-seeking creatures in a cosmos that seems to reward our curiosity at every turn. From the spiraling arms of galaxies to the double helix of DNA, nature speaks in the language of mathematics, and we have slowly, painstakingly learned to listen.

Light travels at precisely 299,792,458 meters per second. This is not merely a number — it is the speed limit of reality itself, woven into the fabric of spacetime by forces we are only beginning to comprehend. When you look at a star, you are not seeing it as it is. You are seeing it as it was, years or centuries or millennia ago. The night sky is a museum of ancient light.

Consider the neuron. A single cell, unremarkable in isolation. But connect eighty-six billion of them in the right configuration, and something extraordinary emerges: consciousness. The ability to wonder. The capacity to ask why. We are the universe examining itself, matter that has learned to contemplate matter. This is perhaps the most astonishing fact in all of science.

In 1687, Isaac Newton published the Principia Mathematica, and the world changed. His three laws of motion and the law of universal gravitation explained everything from the fall of an apple to the orbit of the moon. For two centuries, Newtonian mechanics reigned supreme, a clockwork universe ticking along with perfect predictability. Then came Einstein.

Special relativity, published in 1905, shattered our intuitions about space and time. They were not absolute stages upon which physics played out — they were themselves part of the performance, stretching and compressing depending on your speed. Mass and energy were revealed to be two faces of the same coin, related by the most famous equation in history: E equals mc squared.

But Einstein was not finished. Ten years later, general relativity reimagined gravity itself. It was not a force pulling objects together across empty space. It was the curvature of spacetime, bent and warped by mass and energy. The Earth does not fall toward the Sun because of an invisible tether. It follows the curved geometry of spacetime that the Sun's mass creates. Gravity is geometry.

The quantum world is stranger still. At the smallest scales, particles do not have definite positions or velocities until they are measured. They exist in superpositions, ghostly combinations of all possible states. Schrödinger's famous cat, both alive and dead until observed, was meant as a reductio ad absurdum — but nature sided with the absurd.

Entanglement, which Einstein dismissively called "spooky action at a distance," allows two particles to be correlated in ways that defy classical explanation. Measure one, and you instantly know something about the other, no matter how far apart they are. This is not communication — no information travels faster than light — but it is a correlation that has no classical analog. The universe is nonlocal, interconnected in ways we are still struggling to map.

The history of science is a history of humility. We once believed the Earth was the center of the universe. Then we learned it orbits the Sun. Then we learned the Sun is one of hundreds of billions of stars in the Milky Way. Then we learned the Milky Way is one of hundreds of billions of galaxies in the observable universe. And now we suspect the observable universe may be a tiny fraction of all that exists.

Dark matter makes up about twenty-seven percent of the universe's mass-energy content. We cannot see it, touch it, or detect it directly. We know it exists only because of its gravitational effects on visible matter — galaxies rotate too fast, clusters of galaxies are too massive, the cosmic web has too much structure. Something is there, invisible and pervasive, shaping the cosmos from the shadows.

Dark energy is even more mysterious. It makes up about sixty-eight percent of the universe and is driving the accelerating expansion of space itself. Every galaxy beyond our local group is rushing away from us, faster and faster, carried by the swelling of spacetime. In the far future, the observable universe will shrink to a lonely island of gravitationally bound stars, surrounded by an ocean of unreachable darkness.

Life emerged on Earth approximately 3.8 billion years ago. From the first self-replicating molecules in a warm pond or a deep-sea vent, evolution has sculpted an astonishing diversity of forms. Bacteria, archaea, fungi, plants, animals — all connected by an unbroken chain of descent, all sharing the same genetic code, all cousins in the family tree of life.

The human brain consumes about twenty watts of power — less than a dim light bulb — yet performs computations that no supercomputer can match. It processes language, recognizes faces, navigates social hierarchies, dreams, creates art, falls in love, and contemplates its own mortality. It does all of this with a wet, three-pound organ that runs on glucose and electrical impulses.

We have sent robots to Mars, probes to the edge of the solar system, and radio signals into the void. We have split the atom, decoded the genome, and photographed a black hole. We have built machines that can beat us at chess, Go, and now at generating language itself. And yet we still do not understand consciousness, cannot cure the common cold, and argue about whether the dress is blue or gold.

Perhaps that is the beauty of it. Science is not a finished cathedral but a construction site, noisy and chaotic and full of scaffolding. Every answer reveals ten new questions. Every solved mystery opens a door to deeper mysteries. The more we learn, the more we realize how much we do not know. And that is not a failure — it is an invitation.

The James Webb Space Telescope, launched on Christmas Day 2021, peers back to the earliest epochs of cosmic history. Its infrared eyes see galaxies as they were thirteen billion years ago, just a few hundred million years after the Big Bang. Some of these primordial galaxies are unexpectedly massive, challenging our models of how quickly structure can form in a young universe.

On the smallest scales, string theory proposes that the fundamental constituents of reality are not point particles but tiny vibrating strings of energy. Different vibrational modes produce different particles, much as different vibrations of a guitar string produce different notes. The theory requires extra dimensions of space — six or seven of them — curled up so tightly that we cannot perceive them directly.

Information may be the most fundamental quantity in physics. The holographic principle suggests that all the information contained in a volume of space can be encoded on its boundary, like a three-dimensional scene projected from a two-dimensional film. Black holes, once thought to destroy information, are now believed to encode it on their event horizons, preserving the cosmic ledger.

As you read these words, photons are striking your retinas, triggering cascades of electrochemical signals that your brain assembles into meaning. You are performing an act of translation — converting squiggles of ink into ideas, memories, emotions. Reading is a miracle so commonplace that we have forgotten to marvel at it. But marvel you should, for in this moment, across the gulf of space and time, one mind is reaching out to touch another.`

const FONT_SIZE = 18
const LINE_HEIGHT = 28
const FONT = `${FONT_SIZE}px Georgia`
const PADDING = 80
const OBSTACLE_RADIUS = 80
const REPEL_RADIUS = OBSTACLE_RADIUS + 12
const WARP_RADIUS = 140 // how far gravitational lensing reaches
const WARP_STRENGTH = 6000 // lensing intensity (higher = more pull)
const TILE = 10 // tile size for displacement sampling

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// Offscreen canvas for text rendering, composited with light mask
const textCanvas = document.createElement('canvas')
const textCtx = textCanvas.getContext('2d')!

let dpr = window.devicePixelRatio || 1
let W = 0
let H = 0
let mouseX = -9999
let mouseY = -9999
let scrollY = 0
let targetScrollY = 0

// Smooth mouse tracking
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

const TEXT_COLOR = 'rgba(210, 210, 218, 0.92)'

// For a circle centered at (cx, cy) with radius r,
// return the horizontal extent [xLeft, xRight] at vertical position y.
// Returns null if no intersection.
function circleXExtent(cx: number, cy: number, r: number, y: number): [number, number] | null {
  const dy = y - cy
  if (Math.abs(dy) >= r) return null
  const dx = Math.sqrt(r * r - dy * dy)
  return [cx - dx, cx + dx]
}

function drawTextSegment(text: string, x: number, y: number) {
  textCtx.fillStyle = TEXT_COLOR
  textCtx.fillText(text, x, y)
}

function draw() {
  if (!prepared) return

  ctx.clearRect(0, 0, W, H)
  textCtx.clearRect(0, 0, W, H)

  // Smooth mouse interpolation
  smoothMouseX += (mouseX - smoothMouseX) * 0.25
  smoothMouseY += (mouseY - smoothMouseY) * 0.25

  // Smooth scroll
  scrollY += (targetScrollY - scrollY) * 0.15

  const contentWidth = Math.min(720, W - PADDING * 2)
  const contentLeft = (W - contentWidth) / 2

  const obX = smoothMouseX
  const obY = smoothMouseY

  // ---- Render all text onto offscreen canvas ----
  textCtx.font = FONT
  textCtx.textBaseline = 'top'

  const MIN_SIDE = FONT_SIZE * 3
  const GAP = 6
  const contentRight = contentLeft + contentWidth

  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = PADDING - scrollY

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
      if (y + LINE_HEIGHT > 0) drawTextSegment(line.text, contentLeft, textY)
      cursor = line.end
    } else {
      const spaceLeft = Math.max(0, Math.min(circleXL - GAP, contentRight) - contentLeft)
      const spaceRight = Math.max(0, contentRight - Math.max(circleXR + GAP, contentLeft))
      const hasLeft = spaceLeft >= MIN_SIDE
      const hasRight = spaceRight >= MIN_SIDE

      if (hasLeft && hasRight) {
        const leftLine = layoutNextLine(prepared, cursor, spaceLeft)
        if (leftLine === null) break
        if (y + LINE_HEIGHT > 0) drawTextSegment(leftLine.text, contentLeft, textY)

        const rightLine = layoutNextLine(prepared, leftLine.end, spaceRight)
        if (rightLine !== null) {
          const rightX = Math.max(circleXR + GAP, contentLeft)
          if (y + LINE_HEIGHT > 0) drawTextSegment(rightLine.text, rightX, textY)
          cursor = rightLine.end
        } else {
          cursor = leftLine.end
        }
      } else if (hasLeft) {
        const line = layoutNextLine(prepared, cursor, spaceLeft)
        if (line === null) break
        if (y + LINE_HEIGHT > 0) drawTextSegment(line.text, contentLeft, textY)
        cursor = line.end
      } else if (hasRight) {
        const rightX = Math.max(circleXR + GAP, contentLeft)
        const line = layoutNextLine(prepared, cursor, spaceRight)
        if (line === null) break
        if (y + LINE_HEIGHT > 0) drawTextSegment(line.text, rightX, textY)
        cursor = line.end
      } else {
        y += LINE_HEIGHT
        continue
      }
    }

    y += LINE_HEIGHT
  }

  const totalHeight = y + scrollY - PADDING + PADDING * 2
  const maxScroll = Math.max(0, totalHeight - H)
  targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll))

  // ---- Black hole: pure black disc ----
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(obX, obY, OBSTACLE_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  // ---- Composite text with gravitational lensing warp ----
  // Draw tiles outside warp radius directly (fast path)
  // Draw tiles inside warp radius with radial displacement toward black hole

  const warpL = Math.max(0, Math.floor((obX - WARP_RADIUS) / TILE) * TILE)
  const warpR = Math.min(W, Math.ceil((obX + WARP_RADIUS) / TILE) * TILE)
  const warpT = Math.max(0, Math.floor((obY - WARP_RADIUS) / TILE) * TILE)
  const warpB = Math.min(H, Math.ceil((obY + WARP_RADIUS) / TILE) * TILE)

  // Draw non-warped regions (4 rectangles around the warp zone)
  // Top strip
  if (warpT > 0)
    ctx.drawImage(textCanvas, 0, 0, W * dpr, warpT * dpr, 0, 0, W, warpT)
  // Bottom strip
  if (warpB < H)
    ctx.drawImage(textCanvas, 0, warpB * dpr, W * dpr, (H - warpB) * dpr, 0, warpB, W, H - warpB)
  // Left strip (between top and bottom)
  if (warpL > 0)
    ctx.drawImage(textCanvas, 0, warpT * dpr, warpL * dpr, (warpB - warpT) * dpr, 0, warpT, warpL, warpB - warpT)
  // Right strip
  if (warpR < W)
    ctx.drawImage(textCanvas, warpR * dpr, warpT * dpr, (W - warpR) * dpr, (warpB - warpT) * dpr, warpR, warpT, W - warpR, warpB - warpT)

  // Draw warped tiles
  for (let ty = warpT; ty < warpB; ty += TILE) {
    for (let tx = warpL; tx < warpR; tx += TILE) {
      const cx = tx + TILE / 2
      const cy = ty + TILE / 2
      const dx = cx - obX
      const dy = cy - obY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > WARP_RADIUS) {
        // Outside warp — draw directly
        ctx.drawImage(textCanvas, tx * dpr, ty * dpr, TILE * dpr, TILE * dpr, tx, ty, TILE, TILE)
        continue
      }

      if (dist < OBSTACLE_RADIUS * 0.95) {
        // Inside event horizon — swallowed, don't draw
        continue
      }

      // Gravitational displacement: pull source position toward the black hole
      // Strength falls off with distance squared, creating realistic lensing
      const normDist = dist / WARP_RADIUS
      const falloff = 1 - normDist
      const displacement = WARP_STRENGTH * falloff * falloff / Math.max(dist, 1)
      const angle = Math.atan2(dy, dx)

      // Source coordinates — where to sample from (shifted toward black hole)
      const srcX = tx + Math.cos(angle) * displacement
      const srcY = ty + Math.sin(angle) * displacement

      // Tangential stretch: scale tile perpendicular to radial direction
      const stretch = 1 + displacement * 0.008

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      // Scale: compress radially, stretch tangentially
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

  requestAnimationFrame(draw)
}

// Event listeners
window.addEventListener('resize', () => {
  resize()
})

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
})

window.addEventListener('wheel', (e) => {
  e.preventDefault()
  targetScrollY += e.deltaY
}, { passive: false })

// Touch support
let lastTouchY = 0
window.addEventListener('touchstart', (e) => {
  lastTouchY = e.touches[0].clientY
  mouseX = e.touches[0].clientX
  mouseY = e.touches[0].clientY
})

window.addEventListener('touchmove', (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  mouseX = touch.clientX
  mouseY = touch.clientY
  targetScrollY -= (touch.clientY - lastTouchY)
  lastTouchY = touch.clientY
}, { passive: false })

// Initialize
resize()
prepareText()
requestAnimationFrame(draw)
