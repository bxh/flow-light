/** Horizontal chord of a circle at vertical slice y. Returns null if no intersection. */
export function circleXExtent(cx: number, cy: number, r: number, y: number): [number, number] | null {
  const dy = y - cy
  if (Math.abs(dy) >= r) return null
  const dx = Math.sqrt(r * r - dy * dy)
  return [cx - dx, cx + dx]
}
