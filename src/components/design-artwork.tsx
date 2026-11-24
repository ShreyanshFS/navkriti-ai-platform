import type { Motif, RenderSpec } from "@/lib/studio";

const PAPER = "#F7F1E4";

function prng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function MotifShape({ kind, colors }: { kind: Motif; colors: string[] }) {
  const [c1, c2, c3] = colors;
  if (kind === "floral") {
    return (
      <g>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} rx={6.5} ry={14} cx={0} cy={-15} fill={c1} opacity={0.92} transform={`rotate(${a})`} />
        ))}
        <circle r={7} fill={c2} />
        <circle r={3} fill={c3} />
      </g>
    );
  }
  if (kind === "paisley") {
    return (
      <g>
        <path
          d="M0 -22 C 15 -22 22 -6 13 8 C 7 18 -8 20 -13 8 C -17 -2 -8 -12 1 -9 C 8 -6 8 2 2 5"
          fill="none"
          stroke={c1}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <path d="M-2 2 C 3 2 5 6 2 9" fill="none" stroke={c2} strokeWidth={2} strokeLinecap="round" />
        <circle cx={-6} cy={-12} r={2.2} fill={c2} />
        <circle cx={-1} cy={-16} r={1.6} fill={c3} />
      </g>
    );
  }
  if (kind === "lattice") {
    return (
      <g>
        <path d="M0 -18 L18 0 L0 18 L-18 0 Z" fill="none" stroke={c1} strokeWidth={2.6} />
        <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill={c2} opacity={0.9} />
        {[
          [-18, 0],
          [18, 0],
          [0, -18],
          [0, 18],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.4} fill={c3} />
        ))}
      </g>
    );
  }
  if (kind === "tree") {
    return (
      <g>
        <path d="M0 20 L0 -6" stroke={c1} strokeWidth={3.4} strokeLinecap="round" />
        <path d="M0 4 L-11 -6 M0 8 L11 -3 M0 -2 L-7 -12 M0 -1 L8 -11" stroke={c1} strokeWidth={2} strokeLinecap="round" />
        <circle cx={0} cy={-16} r={8} fill={c2} opacity={0.9} />
        <circle cx={-11} cy={-8} r={5.5} fill={c2} opacity={0.8} />
        <circle cx={11} cy={-6} r={5.5} fill={c2} opacity={0.8} />
        <circle cx={4} cy={-11} r={2} fill={c3} />
        <circle cx={-6} cy={-3} r={1.8} fill={c3} />
      </g>
    );
  }
  return (
    <g>
      <path d="M0 -20 L18 12 L-18 12 Z" fill="none" stroke={c1} strokeWidth={2.6} />
      <path d="M0 -8 L9 7 L-9 7 Z" fill={c2} opacity={0.9} />
      <circle cx={0} cy={16} r={2.6} fill={c3} />
      <circle cx={-23} cy={16} r={2.6} fill={c3} />
      <circle cx={23} cy={16} r={2.6} fill={c3} />
    </g>
  );
}

export function DesignArtwork({ spec, className = "" }: { spec: RenderSpec; className?: string }) {
  const colors = spec.palette && spec.palette.length >= 3 ? spec.palette : ["#EFE7D8", "#C1502E", "#5F7A52", "#2B3A8F", "#26221E"];
  const [p1, p2, p3, p4] = colors;
  const trio = [p2, p3, p1];
  const sleeveKind: Motif = spec.sleeveMotif ?? "geometric";
  const uid = `nk${spec.seed}${spec.motif}${spec.layout}`;
  const rand = prng(spec.seed);
  const rot = Math.round(rand() * 24) - 12;
  const bgTone = spec.layout === "framed" ? PAPER : "#FBF6EC";

  return (
    <svg viewBox="0 0 480 600" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="AI generated design concept">
      <defs>
        <pattern id={`tile-${uid}`} width="72" height="72" patternUnits="userSpaceOnUse" patternTransform={`rotate(${rot})`}>
          <g transform="translate(18,18) scale(0.95)">
            <MotifShape kind={spec.motif} colors={trio} />
          </g>
          <g transform="translate(54,54) scale(0.75) rotate(22)">
            <MotifShape kind={spec.motif} colors={[p3, p2, p1]} />
          </g>
          <circle cx="54" cy="18" r="2.2" fill={p2} opacity={0.75} />
          <circle cx="18" cy="54" r="2.2" fill={p2} opacity={0.75} />
        </pattern>

        <pattern id={`band-${uid}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill={p2} />
          <g transform="translate(14,14) scale(0.55)">
            <MotifShape kind={sleeveKind} colors={[PAPER, p3, p4]} />
          </g>
        </pattern>

        <pattern id={`grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1d1712" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>

        <clipPath id={`kurti-clip-${uid}`}>
          <path d="M 175 68 Q 240 88 305 68 L 442 162 L 414 226 L 330 174 L 348 534 L 132 534 L 150 174 L 66 226 L 38 162 Z" />
        </clipPath>

        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="480" height="600" fill={bgTone} />

      {/* ─────────────── CUSTOM KURTI / GARMENT SILHOUETTE ─────────────── */}
      {spec.layout === "kurti" && (
        <>
          <rect width="480" height="600" fill={`url(#grid-${uid})`} />
          {/* soft studio halo */}
          <circle cx="240" cy="295" r="220" fill={p2} opacity="0.07" />

          {/* Garment body clipped */}
          <g clipPath={`url(#kurti-clip-${uid})`}>
            {/* Base fabric */}
            <rect x="0" y="0" width="480" height="600" fill={p1} />
            {/* All-over subtle chikankari / craft booti pattern */}
            <rect x="0" y="0" width="480" height="600" fill={`url(#tile-${uid})`} opacity="0.52" />

            {/* Left Sleeve / Hand Area Block Pattern Cuff */}
            <g transform="rotate(-31 62 194)">
              <rect x="18" y="138" width="62" height="120" fill={`url(#band-${uid})`} />
              <line x1="80" y1="138" x2="80" y2="258" stroke={p4} strokeWidth="3" />
              <line x1="86" y1="138" x2="86" y2="258" stroke={p2} strokeWidth="1.5" strokeDasharray="3 3" />
            </g>

            {/* Right Sleeve / Hand Area Block Pattern Cuff */}
            <g transform="rotate(31 418 194)">
              <rect x="400" y="138" width="62" height="120" fill={`url(#band-${uid})`} />
              <line x1="400" y1="138" x2="400" y2="258" stroke={p4} strokeWidth="3" />
              <line x1="394" y1="138" x2="394" y2="258" stroke={p2} strokeWidth="1.5" strokeDasharray="3 3" />
            </g>

            {/* Yoke / Neckline Embroidery Panel (Chikankari / Primary Craft) */}
            <path
              d="M 182 68 L 298 68 L 292 225 Q 240 248 188 225 Z"
              fill={PAPER}
              stroke={p2}
              strokeWidth="2.5"
            />
            <path
              d="M 190 74 L 290 74 L 285 218 Q 240 238 195 218 Z"
              fill="none"
              stroke={p3}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Dense Yoke Motifs */}
            <g transform="translate(240, 152) scale(1.35)">
              <MotifShape kind={spec.motif} colors={[p2, p3, p4]} />
            </g>
            <g transform="translate(212, 188) scale(0.75)">
              <MotifShape kind={spec.motif} colors={[p3, p2, p4]} />
            </g>
            <g transform="translate(268, 188) scale(0.75)">
              <MotifShape kind={spec.motif} colors={[p3, p2, p4]} />
            </g>

            {/* Neckline cutout + keyhole */}
            <path d="M 204 66 Q 240 112 276 66 Z" fill={bgTone} stroke={p4} strokeWidth="2.5" />
            <path d="M 240 100 L 233 122 Q 240 130 247 122 Z" fill={bgTone} stroke={p4} strokeWidth="2" />

            {/* Hem / Daaman Block Pattern Border */}
            <rect x="125" y="476" width="230" height="58" fill={`url(#band-${uid})`} />
            <line x1="125" y1="476" x2="355" y2="476" stroke={p4} strokeWidth="3" />
            <line x1="125" y1="470" x2="355" y2="470" stroke={p2} strokeWidth="1.8" strokeDasharray="4 4" />

            {/* Side Chaak / Slit Borders */}
            <rect x="132" y="340" width="12" height="194" fill={p2} opacity="0.85" />
            <rect x="336" y="340" width="12" height="194" fill={p2} opacity="0.85" />
          </g>

          {/* Garment Silhouette Outline */}
          <path
            d="M 175 68 Q 240 88 305 68 L 442 162 L 414 226 L 330 174 L 348 534 L 132 534 L 150 174 L 66 226 L 38 162 Z"
            fill="none"
            stroke="#1d1712"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Architectural Callout Badges */}
          {/* Yoke callout */}
          <g>
            <line x1="268" y1="145" x2="362" y2="92" stroke="#1d1712" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="268" cy="145" r="3.5" fill={p2} stroke="#fff" strokeWidth="1.2" />
            <rect x="336" y="68" width="128" height="24" rx="12" fill="#1d1712" />
            <text x="400" y="84" textAnchor="middle" fill="#fbf6ec" fontSize="9.5" fontWeight="700" letterSpacing="0.8">
              YOKE · {spec.motif.toUpperCase()}
            </text>
          </g>

          {/* Sleeve / Hand Area callout */}
          <g>
            <line x1="68" y1="196" x2="96" y2="274" stroke="#1d1712" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="68" cy="196" r="3.5" fill={p2} stroke="#fff" strokeWidth="1.2" />
            <rect x="16" y="272" width="142" height="24" rx="12" fill={p2} />
            <text x="87" y="288" textAnchor="middle" fill="#fbf6ec" fontSize="9.5" fontWeight="700" letterSpacing="0.7">
              HAND CUFF · BLOCK PRINT
            </text>
          </g>

          {/* Daaman / Hem callout */}
          <g>
            <line x1="295" y1="505" x2="358" y2="558" stroke="#1d1712" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="295" cy="505" r="3.5" fill={p2} stroke="#fff" strokeWidth="1.2" />
            <rect x="292" y="554" width="168" height="24" rx="12" fill="#1d1712" />
            <text x="376" y="570" textAnchor="middle" fill="#e2a03c" fontSize="9.5" fontWeight="700" letterSpacing="0.7">
              DAAMAN · CONTRAST BORDER
            </text>
          </g>
        </>
      )}

      {/* ─────────────── FRAMED PAINTING ─────────────── */}
      {spec.layout === "framed" && (
        <>
          <rect x="18" y="18" width="444" height="564" fill={p4} />
          <rect x="26" y="26" width="428" height="548" fill="none" stroke={p3} strokeWidth="2" />
          <rect x="36" y="36" width="408" height="528" fill={`url(#tile-${uid})`} opacity="0.6" />
          <rect x="36" y="36" width="408" height="528" fill={PAPER} opacity="0.55" />
          <g>
            <circle cx="240" cy="300" r="132" fill={PAPER} stroke={p3} strokeWidth="3" />
            <circle cx="240" cy="300" r="120" fill="none" stroke={p2} strokeWidth="1.6" strokeDasharray="5 7" />
            <g transform="translate(240,296) scale(4.1)">
              <MotifShape kind={spec.motif} colors={[p1, p2, p3]} />
            </g>
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`translate(240,300) rotate(${a}) translate(0,-152) scale(1.1)`}>
                <MotifShape kind={spec.motif} colors={[p2, p1, p3]} />
              </g>
            ))}
          </g>
          {[
            [58, 58],
            [422, 58],
            [58, 542],
            [422, 542],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 22} y={y - 22} width="44" height="44" fill={`url(#band-${uid})`} />
          ))}
          <rect x="46" y="46" width="388" height="508" fill="none" stroke={p3} strokeWidth="1" opacity="0.7" />
        </>
      )}

      {/* ─────────────── SAREE / DUPATTA PANEL ─────────────── */}
      {spec.layout === "panel" && (
        <>
          <rect x="0" y="0" width="480" height="600" fill={`url(#tile-${uid})`} opacity="0.9" />
          <rect x="0" y="0" width="480" height="600" fill={`url(#glow-${uid})`} />
          <rect x="0" y="0" width="26" height="600" fill={`url(#band-${uid})`} />
          <rect x="454" y="0" width="26" height="600" fill={`url(#band-${uid})`} />
          <rect x="26" y="0" width="4" height="600" fill={p3} opacity="0.8" />
          <rect x="450" y="0" width="4" height="600" fill={p3} opacity="0.8" />
          <rect x="26" y="66" width="428" height="30" fill={`url(#band-${uid})`} />
          <rect x="26" y="504" width="428" height="96" fill={p4} />
          {[70, 170, 270, 370].map((x) => (
            <g key={x} transform={`translate(${x},552) scale(1.15)`}>
              <MotifShape kind={spec.motif} colors={[p3, p1, p2]} />
            </g>
          ))}
          <rect x="26" y="504" width="428" height="7" fill={p3} />
          <path
            d="M26 504 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0 q20 -16 40 0"
            fill="none"
            stroke={p3}
            strokeWidth="3"
          />
          <g>
            <circle cx="240" cy="300" r="86" fill={PAPER} opacity="0.94" stroke={p3} strokeWidth="2.5" />
            <g transform="translate(240,296) scale(2.9)">
              <MotifShape kind={spec.motif} colors={[p1, p2, p3]} />
            </g>
          </g>
          {[
            [86, 150],
            [394, 150],
            [86, 440],
            [394, 440],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y}) scale(1.1) rotate(${i % 2 ? 12 : -12})`}>
              <MotifShape kind={spec.motif} colors={[p2, p3, p1]} />
            </g>
          ))}
          <rect x="26" y="96" width="428" height="408" fill="none" stroke={p3} strokeWidth="1.4" opacity="0.65" strokeDasharray="2 6" />
        </>
      )}

      {/* ─────────────── PRINTED TEXTILE SWATCH ─────────────── */}
      {spec.layout === "swatch" && (
        <>
          <rect x="0" y="0" width="480" height="600" fill={`url(#tile-${uid})`} />
          <rect x="0" y="0" width="480" height="600" fill={`url(#glow-${uid})`} />
          <rect x="0" y="0" width="480" height="52" fill={`url(#band-${uid})`} />
          <rect x="0" y="548" width="480" height="52" fill={`url(#band-${uid})`} />
          <rect x="0" y="52" width="480" height="5" fill={p3} />
          <rect x="0" y="543" width="480" height="5" fill={p3} />
          <g>
            <circle cx="240" cy="300" r="104" fill={PAPER} opacity="0.92" stroke={p3} strokeWidth="2.5" />
            <circle cx="240" cy="300" r="92" fill="none" stroke={p2} strokeWidth="1.4" strokeDasharray="4 6" />
            <g transform="translate(240,296) scale(3.4)">
              <MotifShape kind={spec.motif} colors={[p1, p2, p3]} />
            </g>
          </g>
          {[120, 360].map((x) => (
            <g key={x} transform={`translate(${x},170) scale(1.05)`}>
              <MotifShape kind={spec.motif} colors={[p2, p3, p1]} />
            </g>
          ))}
          {[120, 360].map((x) => (
            <g key={x} transform={`translate(${x},430) scale(1.05)`}>
              <MotifShape kind={spec.motif} colors={[p2, p3, p1]} />
            </g>
          ))}
        </>
      )}

      <rect width="480" height="600" filter={`url(#grain-${uid})`} opacity="0.05" />
    </svg>
  );
}
