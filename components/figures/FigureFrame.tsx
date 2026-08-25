import type { ReactNode } from "react";

// A figure is a plate in a technical report, not a card: hairline rule, mono
// caption, the plot, and a disclosed table twin. No shadow, no radius, no fill
// — the page's own surface shows through, so figures inherit the dusk tokens
// instead of sitting on top of them.
export function FigureFrame({
  index,
  title,
  note,
  children,
  table,
  wide = true,
}: {
  index: string;
  title: string;
  note?: string;
  children: ReactNode;
  table?: ReactNode;
  /**
   * Plot-bearing figures are drawn on a 760-unit viewBox. Letting that shrink
   * to a phone's width renders their labels at ~4px, so they get a bounded
   * scroller instead and keep a legible scale. Figures that are already
   * responsive HTML (the KPI row) pass `wide={false}` and reflow normally.
   */
  wide?: boolean;
}) {
  return (
    <figure className="m-0 border-t border-dusk-line pt-4">
      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-mono-size uppercase tracking-[0.14em] text-dusk-copper">
          Fig. {index}
        </span>
        <span className="font-mono text-mono-size uppercase tracking-[0.14em] text-dusk-ink">
          {title}
        </span>
      </figcaption>

      {note ? (
        <p className="mt-2 max-w-xl text-small leading-relaxed text-dusk-ink-secondary">
          {note}
        </p>
      ) : null}

      {wide ? (
        <div className="-mx-6 mt-6 overflow-x-auto px-6">
          <div className="min-w-[640px]">{children}</div>
        </div>
      ) : (
        <div className="mt-6">{children}</div>
      )}

      {table ? (
        <details className="mt-5 group">
          <summary className="cursor-pointer font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary transition-colors hover:text-dusk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk-copper">
            Table view
          </summary>
          <div className="mt-3 overflow-x-auto">{table}</div>
        </details>
      ) : null}
    </figure>
  );
}

// Shared table styling so every figure's twin reads identically.
export function FigureTable({
  head,
  rows,
}: {
  head: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <table className="w-full border-collapse text-small">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={h}
              scope="col"
              className={`border-b border-dusk-line pb-2 font-mono text-mono-size font-normal uppercase tracking-[0.08em] text-dusk-ink-secondary ${
                i === 0 ? "text-left" : "text-right"
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>
            {r.map((cell, i) => (
              <td
                key={i}
                className={`border-b border-dusk-line py-2 text-dusk-ink ${
                  i === 0
                    ? "text-left"
                    : "text-right [font-variant-numeric:tabular-nums]"
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
