export type PathCommand =
  | { type: "M"; x: number; y: number }
  | { type: "L"; x: number; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "Z" };

const ARITY = { M: 2, L: 2, C: 6, Z: 0 } as const;

/**
 * Parses the deliberately small path subset the monogram authors: absolute
 * M/L/C/Z only. Relative commands and arcs are rejected loudly rather than
 * silently mis-drawn, since every path in this project is generated code.
 */
export function parsePath(d: string): PathCommand[] {
  const tokens = d.match(/[MLCZmlczaAhHvVsSqQtT]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const out: PathCommand[] = [];
  let i = 0;
  let current: keyof typeof ARITY | null = null;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      if (!(token in ARITY)) {
        throw new Error(`parsePath: unsupported command "${token}" (absolute M/L/C/Z only)`);
      }
      current = token as keyof typeof ARITY;
      i++;
    } else if (current === null) {
      throw new Error("parsePath: path must start with a command");
    }

    if (current === "Z") {
      out.push({ type: "Z" });
      current = null;
      continue;
    }

    const need = ARITY[current!];
    const nums: number[] = [];
    while (nums.length < need) {
      const t = tokens[i];
      if (t === undefined || /^[A-Za-z]$/.test(t)) {
        throw new Error(`parsePath: expected ${need} numbers for "${current}"`);
      }
      nums.push(Number(t));
      i++;
    }

    if (current === "M") out.push({ type: "M", x: nums[0], y: nums[1] });
    else if (current === "L") out.push({ type: "L", x: nums[0], y: nums[1] });
    else out.push({ type: "C", x1: nums[0], y1: nums[1], x2: nums[2], y2: nums[3], x: nums[4], y: nums[5] });

    // An M followed by more numbers means implicit L commands.
    if (current === "M") current = "L";
  }

  return out;
}
