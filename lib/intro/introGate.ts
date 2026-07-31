const INTRO_SEEN_KEY = "apd:intro-seen";

export function hasSeenIntro(storage: Pick<Storage, "getItem">): boolean {
  try {
    return storage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    // Storage access can throw (e.g. blocked cookies/storage). Fail open:
    // treat it as "never seen" so the intro is still allowed to attempt to play.
    return false;
  }
}

export function markIntroSeen(storage: Pick<Storage, "setItem">): void {
  try {
    storage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // A storage failure here should never block dismissal of the overlay.
  }
}
