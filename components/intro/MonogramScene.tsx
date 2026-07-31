"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = {
  onComplete: () => void;
  /** The element to dissolve at the end — IntroGate's overlay, not this canvas. */
  fadeTargetRef: RefObject<HTMLElement | null>;
};

/** Ink sits fractionally behind copper so the A's right leg is occluded by the P's stem. */
const REST_Z = { ink: -1, copper: 1 } as const;

/**
 * Renders the AP monogram assembling from 12 extruded chunks.
 *
 * three.js is imported dynamically: this component only mounts after IntroGate
 * has decided the visitor is a first-time, motion-tolerant visitor, so everyone
 * else downloads none of it. Any WebGL failure calls onComplete immediately —
 * the gate must always fail open rather than trap the visitor.
 */
export function MonogramScene({ onComplete, fadeTargetRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callback without making the effect re-run and rebuild the scene.
  // Assigned in an effect (not during render) per react-hooks/refs.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [THREE, { gsap }, { buildChunkGeometry, EXTRUDE_DEPTH }, { CHUNKS, VIEWBOX }, { buildAnimations, TIMING }] =
        await Promise.all([
          import("three"),
          import("gsap"),
          import("@/lib/intro/monogram/geometry"),
          import("@/lib/intro/monogram/chunks"),
          import("@/lib/intro/monogram/timeline"),
        ]);

      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        onCompleteRef.current();
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0xf7f5f1, 1);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Long focal length keeps the reference's near-flat-on look with slight depth.
      const camera = new THREE.PerspectiveCamera(
        28,
        container.clientWidth / container.clientHeight,
        1,
        2000,
      );

      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(-120, 160, 220);
      scene.add(key);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 1.15));

      const faceInk = new THREE.MeshStandardMaterial({ color: 0x1a1815, roughness: 0.82, metalness: 0.05 });
      const faceCopper = new THREE.MeshStandardMaterial({ color: 0xc0682b, roughness: 0.78, metalness: 0.12 });
      // Side walls are LIGHTER than the faces — this inverted relationship is
      // what makes the letters read as metal instead of plastic.
      const side = new THREE.MeshStandardMaterial({ color: 0xc9c2b6, roughness: 0.55, metalness: 0.35 });

      const group = new THREE.Group();
      // Chunk geometry is centred, so re-offset each back to its layout position.
      const meshes = new Map<string, InstanceType<typeof THREE.Mesh>>();
      const geometries: InstanceType<typeof THREE.ExtrudeGeometry>[] = [];

      for (const chunk of CHUNKS) {
        const geometry = buildChunkGeometry(chunk);
        geometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, [
          chunk.material === "ink" ? faceInk : faceCopper,
          side,
        ]);
        mesh.position.set(
          chunk.centroid.u - VIEWBOX.width / 2,
          VIEWBOX.height / 2 - chunk.centroid.v,
          REST_Z[chunk.material],
        );
        mesh.userData.restPosition = mesh.position.clone();
        group.add(mesh);
        meshes.set(chunk.id, mesh);
      }
      scene.add(group);

      const fitCamera = () => {
        const aspect = container.clientWidth / container.clientHeight;
        const fovRad = (camera.fov * Math.PI) / 180;
        // Fit the logo box with margin, accounting for narrow viewports.
        const needed = Math.max(VIEWBOX.height, VIEWBOX.width / aspect) * 1.45;
        camera.position.set(0, 0, needed / (2 * Math.tan(fovRad / 2)) + EXTRUDE_DEPTH);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      fitCamera();

      const timeline = gsap.timeline({
        onUpdate: () => renderer.render(scene, camera),
        onComplete: () => onCompleteRef.current(),
      });

      for (const anim of buildAnimations()) {
        const mesh = meshes.get(anim.id);
        if (!mesh) continue;
        const rest = mesh.userData.restPosition as InstanceType<typeof THREE.Vector3>;

        mesh.position.set(rest.x + anim.from.x, rest.y - anim.from.y, rest.z + anim.from.z);
        mesh.rotation.set(anim.from.rx, anim.from.ry, anim.from.rz);

        timeline.to(
          mesh.position,
          { x: rest.x, y: rest.y, z: rest.z, duration: anim.duration, ease: "power3.out" },
          anim.delay,
        );
        timeline.to(
          mesh.rotation,
          { x: 0, y: 0, z: 0, duration: anim.duration, ease: "power3.out" },
          anim.delay,
        );
      }

      // Hold on the locked monogram, then dissolve the whole overlay — not just
      // the canvas, which would leave the opaque bg-dusk-bg backdrop behind.
      timeline.to(
        fadeTargetRef.current ?? container,
        { opacity: 0, duration: TIMING.dissolve, ease: "power2.inOut" },
        TIMING.assembly + TIMING.hold,
      );

      const onResize = () => {
        fitCamera();
        renderer.render(scene, camera);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        timeline.kill();
        geometries.forEach((g) => g.dispose());
        [faceInk, faceCopper, side].forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      // Never trap the visitor behind a broken intro.
      if (!disposed) onCompleteRef.current();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
    // fadeTargetRef is a ref object (stable identity); including it satisfies
    // exhaustive-deps without causing the scene to rebuild on re-render.
  }, [fadeTargetRef]);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
