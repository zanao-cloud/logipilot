export function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Aurora orbs — pulsam e flutuam */}
      <div className="hero-orb hero-orb-cyan" />
      <div className="hero-orb hero-orb-blue" />
      <div className="hero-orb hero-orb-indigo" />
      <div className="hero-orb hero-orb-emerald" />

      {/* Constelação SVG sutil — rede de pontos conectados pulsando */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="dot-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={`${n.x}%`}
            cy={`${n.y}%`}
            r={n.r}
            fill="url(#dot-glow)"
            className={`hero-node hero-node-${i % 4}`}
          />
        ))}
        {EDGES.map((e, i) => (
          <line
            key={i}
            x1={`${NODES[e[0]].x}%`}
            y1={`${NODES[e[0]].y}%`}
            x2={`${NODES[e[1]].x}%`}
            y2={`${NODES[e[1]].y}%`}
            stroke="#38bdf8"
            strokeOpacity="0.12"
            strokeWidth="1"
            className={`hero-edge hero-edge-${i % 3}`}
          />
        ))}
      </svg>

      {/* Sweep line — linha de scan que cruza a hero ocasionalmente */}
      <div className="hero-sweep" />

      {/* Grid base preservado */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%)',
        }}
      />
    </div>
  )
}

// Posições aleatórias mas determinísticas pra constelação
const NODES = [
  { x: 8, y: 18, r: 2 },   { x: 22, y: 12, r: 1.5 }, { x: 35, y: 22, r: 2 },
  { x: 50, y: 8, r: 1.5 }, { x: 65, y: 18, r: 2.5 }, { x: 78, y: 14, r: 1.5 },
  { x: 92, y: 24, r: 2 },  { x: 14, y: 40, r: 2 },   { x: 28, y: 48, r: 1.5 },
  { x: 42, y: 38, r: 2.5 },{ x: 58, y: 44, r: 1.5 }, { x: 72, y: 36, r: 2 },
  { x: 86, y: 46, r: 2 },  { x: 6, y: 68, r: 1.5 },  { x: 20, y: 76, r: 2 },
  { x: 34, y: 68, r: 1.5 },{ x: 48, y: 80, r: 2.5 }, { x: 62, y: 70, r: 1.5 },
  { x: 76, y: 78, r: 2 },  { x: 88, y: 72, r: 2 },   { x: 10, y: 88, r: 1.5 },
  { x: 30, y: 92, r: 2 },  { x: 55, y: 90, r: 1.5 }, { x: 80, y: 88, r: 2 },
]

const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
  [20, 21], [21, 22], [22, 23],
  [0, 7], [2, 9], [4, 11], [6, 12],
  [7, 13], [9, 15], [11, 17], [12, 19],
  [13, 20], [16, 22], [18, 23],
  [1, 8], [3, 10], [5, 12], [8, 14], [10, 16], [15, 21],
]
