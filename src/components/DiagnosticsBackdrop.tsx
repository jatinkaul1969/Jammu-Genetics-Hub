export function DiagnosticsBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dh-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="var(--color-brand)" opacity="0.16" />
        </pattern>
      </defs>
      <rect width="800" height="400" fill="url(#dh-grid)" />

      {/* DNA helix, right side */}
      <g opacity="0.14" stroke="var(--color-brand)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M 620 0 C 660 40, 580 80, 620 120 C 660 160, 580 200, 620 240 C 660 280, 580 320, 620 360 C 660 390, 600 400, 600 400" />
        <path d="M 660 0 C 620 40, 700 80, 660 120 C 620 160, 700 200, 660 240 C 620 280, 700 320, 660 360 C 620 390, 680 400, 680 400" />
        {[20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((y) => (
          <line key={y} x1={620 + Math.sin(y / 20) * 20} y1={y} x2={660 - Math.sin(y / 20) * 20} y2={y} strokeWidth="1.5" opacity="0.7" />
        ))}
      </g>

      {/* Test tubes, left side */}
      <g opacity="0.13" stroke="var(--color-accent)" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M 60 40 L 60 140 Q 60 165 85 165 Q 110 165 110 140 L 110 40" />
        <line x1="50" y1="40" x2="120" y2="40" />
        <path d="M 63 100 L 107 100 L 107 138 Q 107 158 85 158 Q 63 158 63 138 Z" fill="var(--color-accent)" opacity="0.5" stroke="none" />

        <path d="M 150 70 L 150 150 Q 150 172 172 172 Q 194 172 194 150 L 194 70" />
        <line x1="142" y1="70" x2="202" y2="70" />
        <path d="M 153 120 L 191 120 L 191 148 Q 191 165 172 165 Q 153 165 153 148 Z" fill="var(--color-accent)" opacity="0.4" stroke="none" />
      </g>

      {/* Molecule cluster, bottom */}
      <g opacity="0.15" fill="var(--color-brand)">
        <circle cx="380" cy="330" r="7" />
        <circle cx="420" cy="310" r="5" />
        <circle cx="410" cy="360" r="5" />
        <circle cx="350" cy="360" r="4" />
        <g stroke="var(--color-brand)" strokeWidth="1.5">
          <line x1="380" y1="330" x2="420" y2="310" />
          <line x1="380" y1="330" x2="410" y2="360" />
          <line x1="380" y1="330" x2="350" y2="360" />
        </g>
      </g>

      {/* Heartbeat pulse line */}
      <path
        d="M 0 220 L 220 220 L 245 160 L 270 280 L 295 220 L 800 220"
        stroke="var(--color-brand)"
        strokeWidth="2"
        fill="none"
        opacity="0.12"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
