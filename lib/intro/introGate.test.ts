import { describe, expect, test } from "vitest";
import { hasSeenIntro, markIntroSeen } from "./introGate";

function createFakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("introGate", () => {
  test("hasSeenIntro is false when nothing has been stored", () => {
    expect(hasSeenIntro(createFakeStorage())).toBe(false);
  });

  test("markIntroSeen then hasSeenIntro returns true", () => {
    const storage = createFakeStorage();
    markIntroSeen(storage);
    expect(hasSeenIntro(storage)).toBe(true);
  });

  test("hasSeenIntro ignores unrelated keys", () => {
    const storage = createFakeStorage();
    storage.setItem("some-other-key", "1");
    expect(hasSeenIntro(storage)).toBe(false);
  });
});
