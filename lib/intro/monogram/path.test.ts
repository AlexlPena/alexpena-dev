import { describe, expect, test } from "vitest";
import { parsePath } from "./path";

describe("parsePath", () => {
  test("parses a closed triangle of move and line commands", () => {
    expect(parsePath("M 0 0 L 10 0 L 5 8 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 10, y: 0 },
      { type: "L", x: 5, y: 8 },
      { type: "Z" },
    ]);
  });

  test("parses a cubic curve command", () => {
    expect(parsePath("M 0 0 C 1 2 3 4 5 6 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 },
      { type: "Z" },
    ]);
  });

  test("accepts commas, negative numbers, and decimals as separators", () => {
    expect(parsePath("M-1.5,0 L2.25,-3 Z")).toEqual([
      { type: "M", x: -1.5, y: 0 },
      { type: "L", x: 2.25, y: -3 },
      { type: "Z" },
    ]);
  });

  test("supports implicit repeated L commands", () => {
    expect(parsePath("M 0 0 L 1 1 2 2 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 1, y: 1 },
      { type: "L", x: 2, y: 2 },
      { type: "Z" },
    ]);
  });

  test("throws on relative commands, which we never author", () => {
    expect(() => parsePath("m 0 0 l 5 5 z")).toThrow(/unsupported/i);
  });

  test("throws when a command has too few numbers", () => {
    expect(() => parsePath("M 0")).toThrow(/expected/i);
  });

  test("throws on stray unrecognized letters rather than silently mis-parsing", () => {
    expect(() => parsePath("M 0 0 X 1 1")).toThrow(/unsupported/i);
  });

  test("throws on arc commands", () => {
    expect(() => parsePath("M 0 0 A 1 1 0 0 1 2 2")).toThrow(/unsupported/i);
  });
});
