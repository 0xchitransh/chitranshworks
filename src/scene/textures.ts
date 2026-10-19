import * as THREE from 'three'

/** Deterministic PRNG so every visit renders the same room. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  return [canvas, ctx]
}

function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = smooth(x - xi)
  const yf = smooth(y - yi)
  const a = hash2(xi, yi, seed)
  const b = hash2(xi + 1, yi, seed)
  const c = hash2(xi, yi + 1, seed)
  const d = hash2(xi + 1, yi + 1, seed)
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
}

export function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 17) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

/** Grayscale (0..255) noise field, returned as a Float32Array in 0..1. */
export function noiseField(w: number, h: number, scale: number, seed: number, octaves = 4): Float32Array {
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[y * w + x] = fbm((x / w) * scale, (y / h) * scale, seed, octaves)
    }
  }
  return out
}

function finish(canvas: HTMLCanvasElement, srgb: boolean, rx = 1, ry = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(rx, ry)
  tex.anisotropy = 4
  return tex
}

export interface PlankOptions {
  size?: number
  planks: number
  base: [number, number, number]
  variance?: number
  seed: number
  /** Planks run vertically (true) or horizontally (false). */
  vertical?: boolean
  grime?: number
}

function drawPlanks(opts: PlankOptions): HTMLCanvasElement {
  const size = opts.size ?? 512
  const [canvas, ctx] = makeCanvas(size, size)
  const rand = rng(opts.seed)
  const { planks, base, vertical = true, variance = 0.22, grime = 0.25 } = opts
  const pw = size / planks
  for (let i = 0; i < planks; i++) {
    const k = 1 + (rand() - 0.5) * 2 * variance
    const r = Math.min(255, base[0] * k)
    const g = Math.min(255, base[1] * k)
    const b = Math.min(255, base[2] * k)
    ctx.save()
    if (!vertical) {
      ctx.translate(0, size)
      ctx.rotate(-Math.PI / 2)
    }
    const x0 = i * pw
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
    ctx.fillRect(x0, 0, pw, size)
    // Grain
    for (let j = 0; j < 46; j++) {
      const gx = x0 + rand() * pw
      const dark = rand() > 0.45
      ctx.strokeStyle = dark ? `rgba(0,0,0,${0.05 + rand() * 0.12})` : `rgba(255,214,170,${0.02 + rand() * 0.05})`
      ctx.lineWidth = 0.5 + rand() * 1.3
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      ctx.bezierCurveTo(gx + (rand() - 0.5) * 8, size * 0.33, gx + (rand() - 0.5) * 8, size * 0.66, gx + (rand() - 0.5) * 5, size)
      ctx.stroke()
    }
    // A knot now and then
    if (rand() > 0.72) {
      const kx = x0 + pw * (0.25 + rand() * 0.5)
      const ky = rand() * size
      const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, pw * 0.3)
      grad.addColorStop(0, 'rgba(0,0,0,0.45)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(kx - pw, ky - pw, pw * 2, pw * 2)
    }
    // Seam
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(x0, 0, 1.4, size)
    ctx.restore()
  }
  // Wear and grime
  const field = noiseField(128, 128, 5, opts.seed + 3, 4)
  const img = ctx.getImageData(0, 0, size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = field[((y * 128) / size | 0) * 128 + ((x * 128) / size | 0)]
      const m = 1 - grime + n * grime * 1.6
      const idx = (y * size + x) * 4
      img.data[idx] *= m
      img.data[idx + 1] *= m
      img.data[idx + 2] *= m
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

const cache = new Map<string, THREE.Texture>()

function cached(key: string, factory: () => THREE.Texture): THREE.Texture {
  let t = cache.get(key)
  if (!t) {
    t = factory()
    cache.set(key, t)
  }
  return t
}

export function disposeTextureCache(): void {
  cache.forEach((t) => t.dispose())
  cache.clear()
}

export function woodTexture(key: string, opts: PlankOptions, repeat: [number, number]): THREE.Texture {
  return cached(`wood:${key}`, () => finish(drawPlanks(opts), true, repeat[0], repeat[1]))
}

/** Roughness variation for the floor: mostly matte with a few worn, glossy patches. */
export function floorRoughness(): THREE.Texture {
  return cached('floor-rough', () => {
    const [canvas, ctx] = makeCanvas(256, 256)
    const field = noiseField(256, 256, 4, 91, 4)
    const img = ctx.createImageData(256, 256)
    for (let i = 0; i < field.length; i++) {
      const v = 0.38 + field[i] * 0.55
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v * 255
      img.data[i * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return finish(canvas, false, 3.7, 1.2)
  })
}

export function fabricTexture(key: string, base: string, thread: string, scale = 1): THREE.Texture {
  return cached(`fabric:${key}`, () => {
    const [canvas, ctx] = makeCanvas(256, 256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    const rand = rng(7)
    ctx.strokeStyle = thread
    for (let i = 0; i < 256; i += 3) {
      ctx.globalAlpha = 0.25 + rand() * 0.3
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 256)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(256, i)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    return finish(canvas, true, 6 * scale, 6 * scale)
  })
}

/** Neutral weave used as a bump map. */
export function weaveBump(repeat = 30): THREE.Texture {
  return cached(`weave:${repeat}`, () => {
    const [canvas, ctx] = makeCanvas(64, 64)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 64, 64)
    for (let y = 0; y < 64; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        const over = ((x + y) / 4) % 2 === 0
        ctx.fillStyle = over ? '#b0b0b0' : '#505050'
        ctx.fillRect(x, y, 4, 2)
        ctx.fillStyle = over ? '#606060' : '#a0a0a0'
        ctx.fillRect(x, y + 2, 4, 2)
      }
    }
    return finish(canvas, false, repeat, repeat)
  })
}

/** Soft radial falloff used for glows and blob shadows. */
export function radialTexture(key = 'radial', stops: [number, string][] = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]): THREE.Texture {
  return cached(`radial:${key}`, () => {
    const [canvas, ctx] = makeCanvas(128, 128)
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    stops.forEach(([o, c]) => g.addColorStop(o, c))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
}

/** Light-shaft texture: fades towards the ends and edges. */
export function beamTexture(): THREE.Texture {
  return cached('beam', () => {
    const [canvas, ctx] = makeCanvas(64, 256)
    const img = ctx.createImageData(64, 256)
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 64; x++) {
        const u = x / 63
        const v = y / 255
        const edge = Math.pow(Math.sin(u * Math.PI), 1.4)
        const along = Math.pow(Math.sin(v * Math.PI), 0.8) * (1 - v * 0.35)
        const a = edge * along
        const i = (y * 64 + x) * 4
        img.data[i] = 255
        img.data[i + 1] = 255
        img.data[i + 2] = 255
        img.data[i + 3] = a * 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
}

/** Text on a plain surface, e.g. plaques and labels. */
export function labelTexture(
  key: string,
  text: string,
  opts: { w?: number; h?: number; bg?: string; fg?: string; font?: string; spacing?: number },
): THREE.Texture {
  return cached(`label:${key}`, () => {
    const w = opts.w ?? 512
    const h = opts.h ?? 128
    const [canvas, ctx] = makeCanvas(w, h)
    if (opts.bg) {
      ctx.fillStyle = opts.bg
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = opts.fg ?? '#E87535'
    ctx.font = opts.font ?? `600 ${h * 0.48}px Inter, Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${opts.spacing ?? 6}px`
    ctx.fillText(text, w / 2, h / 2 + 2)
    return finish(canvas, true)
  })
}
