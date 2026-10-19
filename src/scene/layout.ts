/** Shared room coordinates (metres). The back wall faces +z; the entrance is towards +z. */
export const ROOM = {
  x0: -6,
  x1: 6,
  zBack: -4,
  zFront: 9.5,
  height: 4.2,
}

export const WIN = { cx: 4.8, cy: 2.25, w: 2.2, h: 2.6 }

export const WALL_THICKNESS = 0.35

/** Direction the dusk sun travels through the window (normalised in use). */
export const SUN_FROM: [number, number, number] = [8, 8, -14]

export const POS = {
  jersey: [-2.6, 1.705, -3.62] as [number, number, number],
  board: [2.0, 2.2, -3.97] as [number, number, number],
  monitor: [3.45, 0.86, -3.55] as [number, number, number],
  bag: [0.25, 0, -1.05] as [number, number, number],
  trophies: [-0.4, 0, -3.95] as [number, number, number],
}
