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

  // Lock the page underneath while the overlay is up; restore on dismiss/unmount.
  useLayoutEffect(() => {
    if (phase !== "playing") return;

    const main = document.querySelector("main");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");

    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
    };
  }, [phase]);

  const dismiss = useCallback(() => {
    markIntroSeen(window.localStorage);
    setPhase("dismissed");
  }, []);

  if (phase !== "playing") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dusk-bg">
      <video
        className="h-full w-full object-cover"
        src="/intro/hero-loop.mp4"
        poster="/intro/hero-loop-poster.jpg"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
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
