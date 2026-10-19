/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import {
  PALETTE,
  useSystemCapabilities,
  CSSFallbackScreen,
  PixelStars,
  PixelClouds,
  PixelFireflies,
  FloatingIsland,
  SprintCastle,
} from './LoomyWorld.jsx';
import './fallback.css';

// Lazy-load the 3D Canvas
const LazyAuthCanvas = lazy(() =>
  import('@react-three/fiber').then((r3f) => ({
    default: function AuthCanvasScene({ tabVisible, isMobile }) {
      const { Canvas } = r3f;

      return (
        <Canvas
          aria-hidden="true"
          className="pixel-canvas"
          dpr={[0.5, 0.75]}
          frameloop={tabVisible ? 'always' : 'never'}
          camera={{
            // Static, calm viewpoint looking slightly up at the glowing castle gate
            position: [0, 2.6, 9.8],
            fov: isMobile ? 50 : 42,
            near: 0.1,
            far: 50,
          }}
          gl={{
            antialias: false,
            powerPreference: 'low-power',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Deep RPG Night Sky Fog */}
          <color attach="background" args={[PALETTE.ink]} />
          <fog attach="fog" args={[PALETTE.ink, 12, 34]} />

          {/* Lighting setup */}
          <ambientLight color={PALETTE.night} intensity={0.8} />
          <directionalLight
            position={[5, 10, 6]}
            color={PALETTE.parchment}
            intensity={1.4}
          />
          <directionalLight
            position={[-6, 5, -5]}
            color={PALETTE.sky}
            intensity={0.6}
          />

          {/* Calmer, cheaper scene pieces */}
          <PixelStars count={isMobile ? 50 : 80} reduced />
          <PixelClouds count={isMobile ? 12 : 20} />

          <group position={[0, -0.3, 0]}>
            <FloatingIsland />
            <SprintCastle />
            <PixelFireflies count={12} />
          </group>
        </Canvas>
      );
    },
  }))
);

// ============================================================================
// EXPORT: <AuthBackdrop />
// ============================================================================
export default function AuthBackdrop() {
  const { hasWebGL, prefersReducedMotion, isMobile, tabVisible } =
    useSystemCapabilities();

  const useFallback = !hasWebGL || prefersReducedMotion;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        backgroundColor: PALETTE.ink,
        pointerEvents: 'none', // Strictly must not block clicks on forms above it
        overflow: 'hidden',
      }}
    >
      {useFallback ? (
        <CSSFallbackScreen message="" />
      ) : (
        <Suspense fallback={<CSSFallbackScreen message="" />}>
          <LazyAuthCanvas tabVisible={tabVisible} isMobile={isMobile} />
        </Suspense>
      )}

      {/* Subtle vignette border to frame login forms */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 100px rgba(11, 10, 29, 0.7)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
