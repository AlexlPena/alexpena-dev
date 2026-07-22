type ActMarkerProps = {
  act: string;
  title: string;
  note: string;
};

export function ActMarker({ act, title, note }: ActMarkerProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-6">
      <p className="font-mono text-sm uppercase tracking-widest text-dusk-copper">
        {act}
      </p>
      <h2 className="text-dusk-ink" style={{ fontSize: "var(--text-display)" }}>
        {title}
      </h2>
      <p className="text-dusk-ink-secondary">{note}</p>
    </div>
  );
}
