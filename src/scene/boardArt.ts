import { strategyEdges, strategyNodes } from '../data/strategy'
import { rng } from './textures'

export const BOARD_W = 1024
export const BOARD_H = 665

const INK = '#1d1e24'
const ORANGE = '#d4601f'
const GREY = '#8a877f'
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", "Chalkboard SE", cursive'
const SANS = '"Inter Variable", Inter, Arial, sans-serif'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function fieldPos(fx: number, fy: number): [number, number] {
  return [BOARD_W / 2 + (fx - 0.5) * BOARD_H * 0.92, BOARD_H * 0.07 + fy * BOARD_H * 0.86]
}
function productPos(x: number, y: number): [number, number] {
  return [BOARD_W * 0.09 + x * BOARD_W * 0.82, BOARD_H * 0.24 + y * BOARD_H * 0.56]
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, head = 12) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45))
  ctx.stroke()
}

/**
 * Draws the strategy board. `t` = 0: a cricket field plan; `t` = 1: the same
 * marks recast as a product architecture (field positions → nodes, run/shot
 * arrows → data flow, tactical notes → product decisions).
 */
export function drawBoard(ctx: CanvasRenderingContext2D, t: number): void {
  const w = BOARD_W
  const h = BOARD_H
  const e = ease(clamp01(t))
  const rand = rng(8)

  // Whiteboard surface
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#ece6d6')
  bg.addColorStop(1, '#ddd6c4')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  // faint ghosted marks of earlier drawings
  ctx.fillStyle = 'rgba(80,70,55,0.035)'
  for (let i = 0; i < 40; i++) ctx.fillRect(rand() * w, rand() * h, 40 + rand() * 120, 3)

  // Blueprint grid fades in with the product view
  if (e > 0.02) {
    ctx.strokeStyle = `rgba(60,70,90,${0.1 * e})`
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  // ---- Field markings ----
  const fa = clamp01(1 - e * 1.5)
  if (fa > 0) {
    ctx.save()
    ctx.globalAlpha = fa
    const cx = w / 2
    const cy = h / 2
    ctx.strokeStyle = INK
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, h * 0.47, h * 0.44, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([10, 9])
    ctx.lineWidth = 2
    ctx.strokeStyle = GREY
    ctx.beginPath()
    ctx.ellipse(cx, cy, h * 0.27, h * 0.25, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    // pitch
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    ctx.strokeRect(cx - 17, cy - h * 0.22, 34, h * 0.44)
    // stumps
    ctx.lineWidth = 3
    for (const sy of [cy - h * 0.22, cy + h * 0.22]) {
      for (const dx of [-6, 0, 6]) {
        ctx.beginPath()
        ctx.moveTo(cx + dx, sy - 7)
        ctx.lineTo(cx + dx, sy + 7)
        ctx.stroke()
      }
    }
    // shot / run arrows
    ctx.strokeStyle = ORANGE
    ctx.lineWidth = 3.5
    const shots: [number, number, number, number, number, number][] = [
      [cx + 4, cy + h * 0.2, cx - h * 0.25, cy + h * 0.05, cx - h * 0.4, cy - h * 0.12],
      [cx + 8, cy + h * 0.2, cx + h * 0.12, cy - h * 0.05, cx + h * 0.3, cy - h * 0.34],
      [cx - 6, cy - h * 0.2, cx - h * 0.04, cy, cx + h * 0.02, cy + h * 0.18],
    ]
    for (const [x1, y1, qx, qy, x2, y2] of shots) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(qx, qy, x2, y2)
      ctx.stroke()
      arrow(ctx, qx, qy, x2, y2, 14)
    }
    ctx.restore()
  }

  // ---- Edges (data flow) ----
  const ep = clamp01((e - 0.35) / 0.55)
  if (ep > 0) {
    const nodes = Object.fromEntries(strategyNodes.map((n) => [n.id, n]))
    ctx.strokeStyle = ORANGE
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    for (const [a, b] of strategyEdges) {
      const na = nodes[a]
      const nb = nodes[b]
      const [x1, y1] = productPos(na.x, na.y)
      const [x2, y2] = productPos(nb.x, nb.y)
      const len = Math.hypot(x2 - x1, y2 - y1)
      const ux = (x2 - x1) / len
      const uy = (y2 - y1) / len
      // start/end outside the node boxes
      const pad = 42
      const sx = x1 + ux * pad
      const sy = y1 + uy * pad * 0.7
      const ex = x2 - ux * pad
      const ey = y2 - uy * pad * 0.7
      const px = lerp(sx, ex, ep)
      const py = lerp(sy, ey, ep)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(px, py)
      ctx.stroke()
      if (ep > 0.97) arrow(ctx, sx, sy, ex, ey, 12)
    }
  }

  // ---- Nodes: X marks that become architecture boxes ----
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const n of strategyNodes) {
    const [fx, fy] = fieldPos(n.fx, n.fy)
    const [px, py] = productPos(n.x, n.y)
    const x = lerp(fx, px, e)
    const y = lerp(fy, py, e)

    if (e < 0.55) {
      const a = clamp01(1 - e * 2)
      ctx.globalAlpha = a
      ctx.strokeStyle = INK
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.moveTo(x - 8, y - 8)
      ctx.lineTo(x + 8, y + 8)
      ctx.moveTo(x + 8, y - 8)
      ctx.lineTo(x - 8, y + 8)
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.font = `600 17px ${HAND}`
      ctx.fillText(n.fieldLabel, x, y + 24)
      ctx.globalAlpha = 1
    }

    const ba = clamp01((e - 0.25) / 0.5)
    if (ba > 0) {
      const bw = lerp(16, 128, ba)
      const bh = lerp(16, 42, ba)
      ctx.globalAlpha = ba
      ctx.fillStyle = '#17140f'
      ctx.strokeStyle = ORANGE
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 8)
      ctx.fill()
      ctx.stroke()
      const la = clamp01((e - 0.6) / 0.35)
      if (la > 0) {
        ctx.globalAlpha = la
        ctx.fillStyle = '#F1E9DB'
        ctx.font = `600 18px ${SANS}`
        ctx.fillText(n.label.toUpperCase(), x, y + 1)
      }
      ctx.globalAlpha = 1
    }
  }

  // ---- Handwritten headline + notes ----
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = `700 34px ${HAND}`
  ctx.globalAlpha = clamp01(1 - e * 2)
  ctx.fillText('IDEAS. CODE.', 34, 44)
  ctx.fillText('COMMUNITIES.', 34, 82)
  ctx.fillText('CRICKET.', 34, 120)
  ctx.globalAlpha = clamp01((e - 0.5) * 2)
  ctx.fillText('PROBLEM → PRODUCT → PEOPLE', 34, 52)
  ctx.font = `500 20px ${HAND}`
  ctx.fillStyle = GREY
  ctx.fillText('same game plan, different field', 36, 86)
  ctx.globalAlpha = 1

  ctx.font = `600 22px ${HAND}`
  ctx.fillStyle = ORANGE
  ctx.globalAlpha = clamp01(1 - e * 2)
  ctx.fillText('read the situation', w - 250, h - 62)
  ctx.fillText('rotate the strike', w - 250, h - 32)
  ctx.globalAlpha = clamp01((e - 0.5) * 2)
  ctx.fillText('ship small', w - 250, h - 62)
  ctx.fillText('learn fast', w - 250, h - 32)
  ctx.globalAlpha = 1
}
