/**
 * Decorative background for the Advoka hero: thin rotating orbit rings,
 * a dial of tick marks, drifting geometric outlines and layered radial
 * glow. Everything here is presentational (aria-hidden) and animates
 * with transform/opacity only, so it stays cheap on the main thread and
 * respects prefers-reduced-motion via the orbit and hero-float utility
 * classes defined in globals.css.
 */
export function HeroBackground() {
  const ticks = Array.from({ length: 28 })

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Base atmosphere */}
      <div className="absolute inset-0 bg-background" />
      <div className="hero-bg-in absolute left-1/2 top-[-120px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(91,91,214,0.20),transparent)] blur-3xl" />
      <div className="hero-bg-in absolute left-[18%] top-[220px] h-[380px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(139,124,246,0.14),transparent)] blur-3xl" />
      <div className="hero-bg-in absolute right-[10%] top-[60px] h-[300px] w-[340px] rounded-full bg-[radial-gradient(closest-side,rgba(91,91,214,0.12),transparent)] blur-3xl" />

      {/* Orbit rings + dial, centered on the headline */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full opacity-[0.55]"
      >
        <defs>
          <linearGradient id="ringGradA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="45%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-ai)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ringGradB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-ai)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent-ai)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer slow ring */}
        <g className="orbit-cw" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
          <circle
            cx="720"
            cy="380"
            r="360"
            fill="none"
            stroke="url(#ringGradA)"
            strokeWidth="1"
          />
        </g>

        {/* Mid dashed ring, counter-rotating */}
        <g className="orbit-ccw" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
          <circle
            cx="720"
            cy="380"
            r="270"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </g>

        {/* Inner dial with tick marks */}
        <g className="orbit-ccw-fast" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
          <circle cx="720" cy="380" r="180" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.8" />
          {ticks.map((_, i) => {
            const angle = (360 / ticks.length) * i
            const major = i % 7 === 0
            return (
              <line
                key={i}
                x1="720"
                y1={380 - 180}
                x2="720"
                y2={380 - 180 + (major ? 10 : 5)}
                stroke={major ? 'var(--accent-ai)' : 'var(--border)'}
                strokeWidth={major ? 1.2 : 1}
                strokeLinecap="round"
                opacity={major ? 0.8 : 0.5}
                transform={`rotate(${angle} 720 380)`}
              />
            )
          })}
        </g>

        {/* A single short accent arc, like a progress bezel */}
        <g className="orbit-cw" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
          <circle
            cx="720"
            cy="380"
            r="270"
            fill="none"
            stroke="url(#ringGradB)"
            strokeWidth="1.4"
            strokeDasharray="120 1600"
            strokeLinecap="round"
          />
        </g>

        {/* Pulsing intelligence nodes along the rings */}
        <circle className="dot-pulse" cx="720" cy="20" r="3" fill="var(--accent-ai)" style={{ animationDelay: '0s' }} />
        <circle className="dot-pulse" cx="1080" cy="380" r="2.5" fill="var(--primary)" style={{ animationDelay: '1.1s' }} />
        <circle className="dot-pulse" cx="450" cy="560" r="2.5" fill="var(--accent-ai)" style={{ animationDelay: '2s' }} />
      </svg>

      {/* Drifting geometric outlines */}
      <div
        className="hero-float-a absolute right-[8%] top-[18%] hidden h-24 w-24 rotate-45 rounded-2xl border border-primary/25 bg-primary/[0.03] backdrop-blur-[1px] sm:block"
        style={{ ['--rot' as string]: '45deg' }}
      />
      <div
        className="hero-float-b absolute left-[6%] top-[54%] hidden h-16 w-16 rounded-full border border-accent-ai/25 bg-accent-ai/[0.03] md:block"
      />
      <svg
        className="hero-float-a absolute right-[18%] bottom-[12%] hidden h-14 w-14 text-primary/30 md:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon
          points="50,4 93,27 93,73 50,96 7,73 7,27"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <div className="hero-float-b absolute left-[12%] top-[14%] hidden h-10 w-10 rotate-12 rounded-md border border-border bg-elevated/40 lg:block" />

      {/* Fine grid, masked to a soft dome so it fades at the edges */}
      <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_10%,black,transparent)]" />

      {/* Faint grain for material depth */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03] mix-blend-overlay">
        <filter id="heroGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#heroGrain)" />
      </svg>

      {/* Fade to page background at the bottom edge */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  )
}
