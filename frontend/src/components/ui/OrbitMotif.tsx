import { cn } from '@/lib/utils';

// Ten-segment orbit motif — a subtle reference to the tenth-anniversary theme.
// Used as a secondary decorative element, never as a primary logo.

interface OrbitMotifProps {
  size?: number;
  progress?: number; // 0-1, fills segments
  className?: string;
  active?: boolean;
}

export function OrbitMotif({ size = 40, progress = 0, className, active }: OrbitMotifProps) {
  const segments = 10;
  const radius = size * 0.38;
  const center = size / 2;
  const filledSegments = Math.round(progress * segments);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('inline-block', className)}
      aria-hidden="true"
    >
      <circle cx={center} cy={center} r={radius * 0.35} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        const isFilled = i < filledSegments;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={size * 0.035}
            fill={isFilled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isFilled ? 0 : 0.8}
            opacity={isFilled ? 1 : active ? 0.35 : 0.2}
            className={cn(active && !isFilled && 'animate-pulse')}
            style={{ transition: 'opacity 300ms ease' }}
          />
        );
      })}
    </svg>
  );
}

// A thin progress ring variant for inline use
export function ProgressRing({ size = 16, progress = 0, className }: { size?: number; progress?: number; className?: string }) {
  const stroke = 1.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('inline-block -rotate-90', className)} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} opacity="0.15" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 300ms ease' }}
      />
    </svg>
  );
}
