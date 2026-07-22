type ReadoutProps = {
  children: React.ReactNode;
  className?: string;
};

// Instrument-style mono label: "DEPTH 02 · CONTEXT ENGINEERING · 2024"
export function Readout({ children, className = "" }: ReadoutProps) {
  return (
    <p
      className={`font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-copper ${className}`}
    >
      {children}
    </p>
  );
}
