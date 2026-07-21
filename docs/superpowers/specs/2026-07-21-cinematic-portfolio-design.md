# alexpena.dev — Cinematic Portfolio Design

Date: 2026-07-21
Owner: Alex Pena
Status: Approved direction, pending final review
Scope: Phase 1 of the cinematic personal portfolio

## 1. Identity & Purpose

`alexpena.dev` is the personal flagship site of Alex Pena, AI Solutions Specialist. First-person voice throughout. It is deliberately forked from the Centauri consultancy site (`alex-portfolio` repo): Centauri stays calm and restrained; this site is the cinematic reputation piece.

**Primary audience: peers and the industry.** The site itself is the proof-of-work — built to be shared and to compete with top-tier creative-developer portfolios (Awwwards/FWA caliber). Hiring managers and prospective clients are secondary audiences served by the same content. The closing CTA is soft: "connect with me," not a sales funnel.

**Relationship to Centauri:** separate repo, separate domain, separate identity. Shared DNA (neutral warm palette, rare copper accent, tokens-first discipline) but its own tokens, typeface, and mood. Rules Centauri bans (heavy motion, immersive 3D world, dark-dominant sections) are intentionally in-bounds here.

## 2. Core Concept

**Dusk is the mode.** There is no light/dark toggle. The scroll journey owns the lighting: the page opens in warm daylight, descends into a dark immersive world mid-story, and resurfaces into light at the end. The lighting transition is the signature device.

**The narrative: follow the signal.** A single copper signal — a request entering an AI system — detaches from the opening headline and falls through four strata of the system. The strata are named for Alex's engineering disciplines in chronological order, so the descent through the system is also the arc of his craft since 2023. The deeper the visitor goes, the darker the world and the more autonomous the system becomes. The signal resolves into real outcomes, then the visitor surfaces back into daylight for contact.

## 3. Narrative Structure (six acts on one scroll timeline)

Single page. Master scroll timeline normalized 0→1.

| Act | Scroll | Light | Content |
|---|---|---|---|
| I — Surface | 0–10% | Light | Name, role line, pure typography. Copper signal-dot pulses near the name. Canvas alive but near-imperceptible. |
| II — The Request | 10–20% | First dim | Short editorial beat: scattered tools, manual workflows, disconnected AI experiments. The signal detaches from the DOM and begins to fall — the takeover moment. |
| III — The Descent | 20–70% | Dusk → near-black | Camera follows the signal through four strata (below). ~10–12% scroll each, soft transitional voids between. One caption block + one interactive detail per stratum. |
| IV — Resolution | 70–82% | Deep dark | The signal resolves into outcomes: 2–3 project pieces as "completed runs" — cards materializing in the dark (problem → built → result). |
| V — Ascent | 82–92% | Dark → light | Fast cathartic surfacing. Descent took 50% of scroll; ascent takes 10%. Asymmetry is intentional. |
| VI — Daylight | 92–100% | Light | About note, tools strip, contact (email, GitHub, LinkedIn). Calm mirror of Act I. |

### The four strata (Act III)

1. **Prompt Engineering (2023)** — shallowest, dusk-lit. The signal passes through shaping structures: instruction geometry refining the raw request.
2. **Context Engineering (2024)** — darker. The signal gathers mass: knowledge planes and retrieval threads attach as it falls.
3. **Harness Engineering (2025)** — darker still. The signal enters machinery: tool interfaces, guardrails, MCP-like sockets; parallel signals visible for the first time.
4. **Loop Engineering (2026)** — near-black. The signal is self-driving: autonomous cycles, sub-signals spawning, self-correction. Motion communicates that the system no longer needs the visitor's push.

## 4. Architecture

### Stack

- Next.js 16 (App Router), TypeScript, Tailwind v4 — fresh repo `alexpena-dev`
- React Three Fiber + drei — the persistent canvas world
- GSAP ScrollTrigger + Lenis — one master timeline; single source of truth for all scroll-driven state
- @react-three/postprocessing — bloom, film grain, vignette; DOF on capable GPUs
- Custom GLSL deferred to Phase 2
- GitHub + Vercel

### Three coordinated layers

1. **Scroll layer (conductor).** `ScrollOrchestrator` owns Lenis + the master ScrollTrigger timeline. Publishes normalized progress plus derived act/stratum state. Nothing else listens to scroll directly.
2. **DOM layer.** Real React/HTML for Acts I, II, VI and all captions/cards — selectable, indexable, screen-reader-visible. Theme is CSS custom properties interpolated from scroll progress so DOM and canvas darken in lockstep.
3. **World layer.** One fixed full-viewport `<Canvas>` behind the DOM: `<World>` → `<Stratum1>`…`<Stratum4>` → `<OutcomeField>`, each self-contained (geometry, lights, pointer behavior). `CameraRail` reads progress and drives position/look-at along a curve. The falling signal is its own component driven by the same progress value.

### Content seam

All copy, strata entries, outcome pieces, and links live in typed data modules under `lib/content/`, separate from presentation. Future case studies slot in without touching components.

## 5. Visual System

### Palette — two poles, one interpolation

Every surface/text color is interpolated between light-world and dark-world endpoint tokens by scroll progress.

- **Light world (Acts I, II, VI):** warm off-white `#F7F5F1`, ink `#1A1815`, warm greys for secondary text and lines.
- **Dark world (Acts III–IV):** deep warm graphite `#12100E` at the deepest stratum — never pure black. Intermediate strata at intermediate values. Text inverts to warm off-white.
- **Copper signal `#C0682B` family** — the only chromatic color, kept rare: the signal + trail, stratum-active markers, one detail per outcome card, link hovers. Gains a bloom glow in the dark world. No second accent, ever.
- **Depth atmosphere:** fog + subtle vertical gradient; depth is communicated by lightness value, not hue.

### Typography

- **Display/body: Cabinet Grotesk** (Fontshare, free, self-hosted) — distinct from Centauri's Satoshi, same modern-grotesk family.
- **Technical: JetBrains Mono** — stratum labels, years, instrument-readout captions ("DEPTH 02 · CONTEXT ENGINEERING · 2024"), tools strip.
- Fluid `clamp()` scale. Hero name is the largest element on the site. Body ≥16px.

### Materials (Phase 1)

Matte graphite surfaces, thin emissive copper edges, translucent smoked-glass planes for knowledge layers. The world reads as instrumented infrastructure, not sci-fi.

**Banned (inherited from Centauri, still correct):** orbs, brains, robots, chatbot bubbles, neon cyberpunk, circuit-board decoration, purple SaaS gradients, gradient blobs.

### Grain

Fine film grain over everything (postprocessing) — unifies DOM and canvas so the takeover is seamless; keeps light sections from feeling sterile.

## 6. Motion System

One conductor, three tiers:

- **Tier 1 — Scroll-bound.** All structural motion binds to scroll progress, not time: camera, theme, signal descent, reveals, ascent. Fully reversible scrub. Lenis smoothing (~1s lerp) gives the camera weight.
- **Tier 2 — Ambient.** Clock-driven, subtle: signal pulse, knowledge-plane drift, parallel-signal flicker, autonomous loop cycles. Pauses when tab hidden.
- **Tier 3 — Micro.** Pointer parallax on camera (~1° max), hover states 150–250ms soft ease-out, one interactive detail per stratum. No custom cursor.

### Signature moments

- **The detach (Act II):** the copper dot leaves the DOM and becomes a canvas object — DOM dot fades out the same frame the canvas signal fades in at the same screen position.
- **Stratum crossings:** fog thickens then clears — a breath, not a cut.
- **The realization (III→IV):** the signal accelerates ahead of the camera for the first time — motion communicating autonomy.
- **The ascent (V):** the one fast movement on the site — rushing surfacing, light blooming, immediate calm.

### Rules

Small shared easing set (base `cubic-bezier(0.22, 1, 0.36, 1)`). No bounce, no elastic. Text reveals are soft fade/rise. Mono readout captions may type-on once per visit; nothing else animates per-character.

**Hard bans:** scroll-jacking (the timeline responds; it never hijacks), aggressive zooms, constant high-energy particles, layout-shifting hovers.

## 7. Performance, Accessibility & Fallbacks

### Budgets (verified, not assumed)

- First paint is DOM-only; canvas mounts post-hydration and fades in. LCP < 2s on a mid-range laptop.
- 60fps scroll on a 2020-era integrated-GPU laptop. DPR capped at 2. Instancing for repeated geometry. Strata outside the camera neighborhood culled/paused.
- Postprocessing tiered: bloom + grain always; DOF only on capable GPUs (render benchmark at mount, not UA sniffing).
- Initial JS ≤ ~450KB gzipped; Three/R3F code-split with the canvas.

### Device tiers

1. **Desktop, capable GPU** — full experience.
2. **Desktop, weak GPU** — same journey, reduced effects (no DOF, lower counts, simpler materials).
3. **Mobile/tablet** — designed alternative, no WebGL: same six-act story in DOM, CSS-variable theme interpolation preserves the light→dark→light arc, 2D/SVG stratum illustrations, signal as animated SVG path.
4. **`prefers-reduced-motion`** — no scroll-driven or ambient animation; each act a complete static composition; theme shifts per-section instantly. Full content parity.

### Accessibility

- All narrative text is real DOM in document order; canvas is `aria-hidden`. Semantic headings; the story reads coherently top to bottom in a screen reader.
- WCAG AA (≥4.5:1) verified at every point of the theme interpolation — caption colors interpolate on a curve that preserves contrast through mid-transition, browser-measured at sampled scroll positions.
- Full keyboard access; nothing interactive lives only in the canvas; visible focus states.

### SEO

DOM-first shell is fully indexable. OG image (still of the dark world + name), title/description, personal-site structured data.

## 8. Content (thin for now)

- **Act I/II copy:** name, role line, 2–3 short paragraphs. Voice: confident, concrete, zero buzzwords. Final wording approved by Alex during build.
- **Strata entries:** era name, year, 2–3 sentences each — what the discipline means and what Alex built with it.
- **Outcome pieces (2–3):** title, one-line problem, one-line result — loosely described real work. Schema includes optional fields (stack, metrics, diagram, link) so future case studies enrich without restructuring.
- **Act VI:** short about note, tools strip (n8n, Supabase, Pinecone, Claude Code, Codex, MCPs, Slack, Notion, …), contact links — email `alex@alexpena.dev`, GitHub, LinkedIn (URLs confirmed by Alex before ship).

## 9. Testing & Verification

- `typecheck`, `lint`, `build` clean at every milestone.
- Browser-verified per milestone at 1440px, 1280px, 375px. FPS measured via devtools performance capture during full scroll. Contrast measured at ≥5 scroll positions including mid-transition.
- Mobile and reduced-motion paths tested every milestone, not at the end.
- Scroll QA checklist: scrub down, scrub up, keyboard jumps (Home/End/PageDown), resize mid-journey, tab-hide/-show.

## 10. Phase 1 Milestones

Each milestone ends with a review checkpoint.

1. **Foundation** — repo, Next.js 16 scaffold, token system (both palette poles + interpolation mechanism), fonts, Lenis + master timeline skeleton; light→dark→light arc proven on a placeholder page with no 3D.
2. **The shell** — Acts I, II, VI as finished DOM sections; mobile + reduced-motion story complete end-to-end. **Site is publishable after this milestone.**
3. **The world** — canvas, camera rail, four strata as blocked-out geometry, the signal, the detach moment. Ugly but structurally true.
4. **The descent, refined** — real materials, lighting, fog, per-stratum ambient behavior and interactive details, outcome cards.
5. **Cinematic pass** — postprocessing, ascent choreography, signature-moment polish, performance tuning to budget.
6. **Ship** — SEO/OG, domain, Vercel production, final cross-device QA.

## 11. Out of Scope (future phases)

Phase 1 excludes: custom GLSL shaders; procedural generation; physics engines; Blender/custom assets; WebGPU; audio-reactive elements; live AI-native demos (agent visualizations, streaming responses). Each future phase gets its own spec → plan → build cycle:

- **Phase 2 — Depth:** custom shaders on the world, expanded post-processing (volumetrics, god rays), cinematic camera refinements.
- **Phase 3 — World-building:** procedural generation, physics interactions, custom Blender assets.
- **Phase 4 — AI-native layer:** live/interactive demos of agents, pipelines, workflow graphs.
- **Phase 5 — Frontier:** WebGPU migration, audio, fluid/particle simulation.
