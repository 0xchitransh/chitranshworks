import { fbm, makeCanvas, rng } from './textures'

/** Texture-space size of the jersey artwork. Everything below is expressed in this UV space. */
export const JERSEY_W = 1024
export const JERSEY_H = 760

/** World size of the jersey plane in metres (matches the texture aspect ratio). */
export const JERSEY_WORLD_W = 1.3
export const JERSEY_WORLD_H = (JERSEY_WORLD_W * JERSEY_H) / JERSEY_W

/** Silhouette of a short-sleeved cricket jersey on a w×h canvas. */
export function jerseyPath(w: number, h: number): Path2D {
  const X = (x: number) => x * w
  const Y = (y: number) => y * h
  const p = new Path2D()
  p.moveTo(X(0.37), Y(0.035))
  p.quadraticCurveTo(X(0.5), Y(0.2), X(0.63), Y(0.035))
  p.lineTo(X(0.86), Y(0.12))
  p.lineTo(X(0.995), Y(0.385))
  p.lineTo(X(0.845), Y(0.465))
  p.lineTo(X(0.808), Y(0.385))
  p.lineTo(X(0.82), Y(0.975))
  p.quadraticCurveTo(X(0.5), Y(1.012), X(0.18), Y(0.975))
  p.lineTo(X(0.192), Y(0.385))
  p.lineTo(X(0.155), Y(0.465))
  p.lineTo(X(0.005), Y(0.385))
  p.lineTo(X(0.14), Y(0.12))
  p.closePath()
  return p
}

/** Coarse alpha lookup for the silhouette, used to ignore pointer hits outside the shirt. */
export function buildSilhouetteMask(): { test: (u: number, v: number) => boolean } {
  const w = 128
  const h = Math.round((w * JERSEY_H) / JERSEY_W)
  const [, ctx] = makeCanvas(w, h)
  ctx.fillStyle = '#fff'
  ctx.fill(jerseyPath(w, h))
  const data = ctx.getImageData(0, 0, w, h).data
  return {
    test(u, v) {
      const x = Math.min(w - 1, Math.max(0, Math.floor(u * w)))
      const y = Math.min(h - 1, Math.max(0, Math.floor((1 - v) * h)))
      return data[(y * w + x) * 4 + 3] > 40
    },
  }
}

const ORANGE = '#E87535'
const AMBER = '#DCA45B'
const CREAM = '#F1E9DB'

/** The restored jersey artwork: charcoal fabric, orange trim, personalised name and number. */
export function drawCleanJersey(): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(JERSEY_W, JERSEY_H)
  const w = JERSEY_W
  const h = JERSEY_H
  const path = jerseyPath(w, h)
  const rand = rng(31)

  ctx.save()
  ctx.clip(path)

  // Base fabric
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#26231f')
  base.addColorStop(1, '#171512')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Side panels slightly darker, with subtle pinstripes
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fillRect(0, 0, w * 0.3, h)
  ctx.fillRect(w * 0.7, 0, w * 0.3, h)
  ctx.strokeStyle = 'rgba(232,117,53,0.12)'
  ctx.lineWidth = 1.5
  for (let x = 0; x < w; x += 22) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  // Fabric mesh texture
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.07)'
    ctx.fillRect(rand() * w, rand() * h, 2, 2)
  }

  // Sleeve cuffs
  ctx.lineCap = 'butt'
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 26
  ctx.beginPath()
  ctx.moveTo(w * 1.0, h * 0.375)
  ctx.lineTo(w * 0.85, h * 0.462)
  ctx.moveTo(w * 0.0, h * 0.375)
  ctx.lineTo(w * 0.15, h * 0.462)
  ctx.stroke()
  ctx.strokeStyle = CREAM
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(w * 0.985, h * 0.335)
  ctx.lineTo(w * 0.835, h * 0.42)
  ctx.moveTo(w * 0.015, h * 0.335)
  ctx.lineTo(w * 0.165, h * 0.42)
  ctx.stroke()

  // Collar
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 22
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(w * 0.37, h * 0.035)
  ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.63, h * 0.035)
  ctx.stroke()
  ctx.strokeStyle = CREAM
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(w * 0.375, h * 0.06)
  ctx.quadraticCurveTo(w * 0.5, h * 0.225, w * 0.625, h * 0.06)
  ctx.stroke()

  // Hem trim
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.moveTo(w * 0.19, h * 0.955)
  ctx.quadraticCurveTo(w * 0.5, h * 0.992, w * 0.81, h * 0.955)
  ctx.stroke()

  // Name
  const letter = (ctx as CanvasRenderingContext2D & { letterSpacing?: string })
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = AMBER
  ctx.font = `700 92px Impact, "Arial Narrow", "Oswald", sans-serif`
  letter.letterSpacing = '9px'
  ctx.fillText('CHITRANSH', w * 0.5, h * 0.335)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 2
  ctx.strokeText('CHITRANSH', w * 0.5, h * 0.335)

  // Number
  ctx.font = `700 330px Impact, "Arial Narrow", "Oswald", sans-serif`
  letter.letterSpacing = '8px'
  const grad = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.85)
  grad.addColorStop(0, '#F08648')
  grad.addColorStop(1, '#D8662A')
  ctx.fillStyle = grad
  ctx.fillText('07', w * 0.5, h * 0.64)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(241,233,219,0.55)'
  ctx.strokeText('07', w * 0.5, h * 0.64)

  // Chest crest
  letter.letterSpacing = '0px'
  ctx.fillStyle = ORANGE
  ctx.font = `800 54px Georgia, serif`
  ctx.fillText('C.', w * 0.69, h * 0.215)

  // Soft shading so folds read under light
  const shade = ctx.createLinearGradient(0, 0, w, 0)
  shade.addColorStop(0, 'rgba(0,0,0,0.25)')
  shade.addColorStop(0.5, 'rgba(255,255,255,0.02)')
  shade.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
  return canvas
}

export const DIRT_W = 640
export const DIRT_H = Math.round((DIRT_W * JERSEY_H) / JERSEY_W)

/**
 * Dust and grime layer with an alpha channel. The cleaning interaction erases
 * this canvas in UV space, so the effect follows the shirt exactly.
 */
export function drawDirtLayer(): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(DIRT_W, DIRT_H)
  const rand = rng(404)

  // Low-resolution fbm for broad, organic coverage
  const lw = 160
  const lh = Math.round((lw * DIRT_H) / DIRT_W)
  const [low, lctx] = makeCanvas(lw, lh)
  const img = lctx.createImageData(lw, lh)
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      const n = fbm((x / lw) * 6, (y / lh) * 6, 5, 4)
      const n2 = fbm((x / lw) * 11 + 4, (y / lh) * 11, 9, 3)
      const weight = 0.35 + 0.65 * Math.pow(y / lh, 1.4)
      const a = Math.min(0.86, Math.max(0.14, (n * 0.9 + 0.12) * (0.42 + 0.55 * weight) + 0.1 + n2 * 0.08))
      const mud = Math.min(1, weight * n2 * 1.3)
      const i = (y * lw + x) * 4
      img.data[i] = 128 - mud * 62
      img.data[i + 1] = 110 - mud * 58
      img.data[i + 2] = 92 - mud * 52
      img.data[i + 3] = a * 255
    }
  }
  lctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(low, 0, 0, DIRT_W, DIRT_H)

  // Splatter and scuffs, heavier towards the hem
  for (let i = 0; i < 70; i++) {
    const x = rand() * DIRT_W
    const y = DIRT_H * (0.35 + Math.pow(rand(), 0.7) * 0.65)
    const r = 3 + rand() * 16
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(66,48,34,${0.35 + rand() * 0.35})`)
    g.addColorStop(1, 'rgba(66,48,34,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Fine grain
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(140,122,100,${0.12 + rand() * 0.3})`
    ctx.fillRect(rand() * DIRT_W, rand() * DIRT_H, 1 + rand() * 1.5, 1 + rand() * 1.5)
  }

  // Keep only the part that lies on the shirt
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = '#000'
  ctx.fill(jerseyPath(DIRT_W, DIRT_H))
  ctx.globalCompositeOperation = 'source-over'
  return canvas
}

/** Soft round brush used to erase dust (destination-out). */
export function drawBrush(): HTMLCanvasElement {
  const size = 128
  const [canvas, ctx] = makeCanvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.6, 'rgba(0,0,0,0.96)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}
