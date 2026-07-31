const INTRO_SEEN_KEY = "apd:intro-seen";

export function hasSeenIntro(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(INTRO_SEEN_KEY) === "1";
}

export function markIntroSeen(storage: Pick<Storage, "setItem">): void {
  storage.setItem(INTRO_SEEN_KEY, "1");
}
