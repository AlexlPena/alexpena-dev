type SignalDotProps = {
  className?: string;
};

// The signal: a small copper dot with a soft pulse. Decorative — hidden
// from assistive tech. Pulse is suppressed under prefers-reduced-motion
// via the motion-safe variant.
export function SignalDot({ className = "" }: SignalDotProps) {
  return (
    <span aria-hidden className={`relative inline-flex h-3 w-3 ${className}`}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-dusk-copper opacity-60 motion-safe:animate-signal-pulse" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-dusk-copper" />
    </span>
  );
}
