import { strategyEdges, strategyNodes, type StrategyTab } from '../../data/strategy'

const HIGHLIGHT: Record<StrategyTab, string[]> = {
  engineering: ['point', 'cover', 'mid'],
  product: ['keeper', 'slip', 'long'],
  growth: ['long', 'fine', 'square'],
}

const W = 600
const H = 250
const BW = 104
const BH = 34

const px = (x: number) => 52 + x * (W - 104)
const py = (y: number) => 36 + y * (H - 72)

/** Static SVG of the same architecture the 3D whiteboard morphs into. */
export function ArchitectureDiagram({ tab }: { tab: StrategyTab }) {
  const active = new Set(HIGHLIGHT[tab])
  const byId = Object.fromEntries(strategyNodes.map((n) => [n.id, n]))
  return (
    <figure className="diagram">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="diagram-title diagram-desc">
        <title id="diagram-title">Build workflow</title>
        <desc id="diagram-desc">
          A workflow from problem, through research, architecture, contracts and interface, to launch, then growth and
          community. The highlighted stages belong to the selected discipline.
        </desc>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#E87535" />
          </marker>
        </defs>
        {strategyEdges.map(([a, b]) => {
          const na = byId[a]
          const nb = byId[b]
          const x1 = px(na.x)
          const y1 = py(na.y)
          const x2 = px(nb.x)
          const y2 = py(nb.y)
          const len = Math.hypot(x2 - x1, y2 - y1)
          const ux = (x2 - x1) / len
          const uy = (y2 - y1) / len
          const lit = active.has(a) && active.has(b)
          return (
            <line
              key={`${a}-${b}`}
              x1={x1 + ux * (BW / 2 - 6)}
              y1={y1 + uy * (BH / 2 + 2)}
              x2={x2 - ux * (BW / 2 - 2)}
              y2={y2 - uy * (BH / 2 + 4)}
              stroke={lit ? '#E87535' : '#4a4743'}
              strokeWidth={lit ? 2 : 1.4}
              markerEnd="url(#arrow)"
              opacity={lit ? 1 : 0.7}
            />
          )
        })}
        {strategyNodes.map((n) => {
          const on = active.has(n.id)
          return (
            <g key={n.id} transform={`translate(${px(n.x) - BW / 2} ${py(n.y) - BH / 2})`}>
              <rect
                width={BW}
                height={BH}
                rx={7}
                fill={on ? '#241710' : '#121214'}
                stroke={on ? '#E87535' : '#3a3835'}
                strokeWidth={on ? 1.8 : 1.2}
              />
              <text
                x={BW / 2}
                y={BH / 2 + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                letterSpacing="1.2"
                fill={on ? '#F1E9DB' : '#92908B'}
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="diagram__caption">
        On the whiteboard, field positions become stages and run lines become data flow.
      </figcaption>
    </figure>
  )
}
