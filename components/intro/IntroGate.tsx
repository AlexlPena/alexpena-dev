"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { hasSeenIntro, markIntroSeen } from "@/lib/intro/introGate";

type Phase = "checking" | "playing" | "dismissed";

export function IntroGate() {
  const [phase, setPhase] = useState<Phase>("checking");

  // Resolve before paint so returning visitors never see a flash of the intro.
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(
      reducedMotion || hasSeenIntro(window.localStorage)
        ? "dismissed"
        : "playing",
    );
  }, []);

  const dismiss = useCallback(() => {
    // Dismiss first so a storage failure can never trap the visitor behind
    // the scroll-locked overlay; the write is best-effort after that.
    setPhase("dismissed");
    markIntroSeen(window.localStorage);
  }, []);

  // Lock the page underneath while the overlay is up; restore on dismiss/unmount.
  // Also owns two failsafes tied to the same "playing" lifecycle: an escape-key
  // listener, and a timeout in case the video never fires onEnded/onError
  // (blocked autoplay, stalled network, etc).
  useLayoutEffect(() => {
    if (phase !== "playing") return;

    const main = document.querySelector("main");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);

    // The video is ~8s; 10s gives it headroom before we assume it's stuck.
    const failsafe = window.setTimeout(dismiss, 10_000);

    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(failsafe);
    };
  }, [phase, dismiss]);

  if (phase !== "playing") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Site intro"
      data-lenis-prevent
    >
      <video
        className="h-full w-full object-cover"
        src="/intro/hero-loop.mp4"
        poster="/intro/hero-loop-poster.jpg"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onError={dismiss}
      />
      <button
        type="button"
        onClick={dismiss}
        autoFocus
        className="absolute bottom-8 right-8 rounded-full border border-dusk-line px-5 py-2 font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary transition-colors hover:text-dusk-ink"
      >
        Skip
      </button>
    </div>
  );
}
