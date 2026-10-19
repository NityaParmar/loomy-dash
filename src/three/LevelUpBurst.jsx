/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import * as THREE from 'three';
import {
  PALETTE,
  useSystemCapabilities,
  voxelBoxGeo,
} from './LoomyWorld.jsx';
import './fallback.css';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// Confetti 3D Canvas with internal child component using useFrame
const LazyConfettiCanvas = lazy(() =>
  import('@react-three/fiber').then((r3f) => {
    const { Canvas, useFrame } = r3f;

    function ConfettiMesh({ startTime }) {
      const meshRef = useRef();

      // 45 voxel confetti chunks in gold and sky
      const confetti = useMemo(() => {
        const list = [];
        for (let i = 0; i < 45; i++) {
          const theta = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 4.5;
          list.push({
            vx: Math.cos(theta) * speed,
            vy: 3.0 + Math.random() * 5.0,
            vz: (Math.random() - 0.5) * 3.0,
            rotSpeedX: (Math.random() - 0.5) * 12,
            rotSpeedY: (Math.random() - 0.5) * 12,
            rotSpeedZ: (Math.random() - 0.5) * 12,
            color: i % 2 === 0 ? PALETTE.gold : PALETTE.sky,
            size: 0.18 + Math.random() * 0.16,
          });
        }
        return list;
      }, []);

      useEffect(() => {
        if (!meshRef.current) return;
        confetti.forEach((c, i) => {
          _color.set(c.color);
          meshRef.current.setColorAt(i, _color);
        });
        if (meshRef.current.instanceColor) {
          meshRef.current.instanceColor.needsUpdate = true;
        }
      }, [confetti]);

      useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const elapsed = clock.getElapsedTime() - startTime;
        if (elapsed < 0 || elapsed > 1.25) {
          // Hide all instances
          for (let i = 0; i < confetti.length; i++) {
            _dummy.position.set(0, -999, 0);
            _dummy.scale.set(0.001, 0.001, 0.001);
            _dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, _dummy.matrix);
          }
          meshRef.current.instanceMatrix.needsUpdate = true;
          return;
        }

        const t = elapsed;
        const gravity = 8.5; // Gravity acceleration
        const progress = t / 1.2;
        const scaleMult = Math.max(0, 1.0 - progress * 0.85);

        for (let i = 0; i < confetti.length; i++) {
          const c = confetti[i];
          const x = c.vx * t;
          const y = c.vy * t - 0.5 * gravity * t * t;
          const z = c.vz * t;

          _dummy.position.set(x, y, z);
          _dummy.rotation.set(
            c.rotSpeedX * t,
            c.rotSpeedY * t,
            c.rotSpeedZ * t
          );
          const s = c.size * scaleMult;
          _dummy.scale.set(s, s, s);
          _dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, _dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      });

      return (
        <instancedMesh
          ref={meshRef}
          args={[voxelBoxGeo, null, confetti.length]}
          frustumCulled={false}
        >
          <meshLambertMaterial
            flatShading
            emissive={PALETTE.gold}
            emissiveIntensity={0.6}
          />
        </instancedMesh>
      );
    }

    return {
      default: function ConfettiCanvas({ startTime, tabVisible }) {
        return (
          <Canvas
            aria-hidden="true"
            className="pixel-canvas"
            dpr={[0.5, 0.75]}
            frameloop={tabVisible ? 'always' : 'never'}
            camera={{
              position: [0, 1.0, 7.5],
              fov: 50,
              near: 0.1,
              far: 30,
            }}
            gl={{
              alpha: true,
              antialias: false,
              powerPreference: 'high-performance',
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <ambientLight color={PALETTE.parchment} intensity={1.2} />
            <directionalLight position={[2, 6, 4]} color={PALETTE.gold} intensity={1.5} />
            <ConfettiMesh startTime={startTime} />
          </Canvas>
        );
      },
    };
  })
);

// ============================================================================
// EXPORT: <LevelUpBurst trigger />
// ============================================================================
export default function LevelUpBurst({ trigger = false }) {
  const { hasWebGL, prefersReducedMotion, tabVisible } = useSystemCapabilities();
  const [active, setActive] = useState(false);
  const [startTime, setStartTime] = useState(0);

  // Watch for trigger changing to true
  useEffect(() => {
    if (trigger) {
      setActive(true);
      setStartTime(performance.now() / 1000);

      const timer = setTimeout(() => {
        setActive(false);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Level Up! Quest task completed."
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Voxel Confetti Explosion (if WebGL and motion allowed) */}
      {hasWebGL && !prefersReducedMotion && (
        <Suspense fallback={null}>
          <LazyConfettiCanvas startTime={startTime} tabVisible={tabVisible} />
        </Suspense>
      )}

      {/* Pixel LEVEL UP! Banner */}
      <div
        className="pixel-panel"
        style={{
          position: 'relative',
          zIndex: 10000,
          padding: '20px 32px',
          textAlign: 'center',
          backgroundColor: PALETTE.night,
          border: `6px solid ${PALETTE.gold}`,
          boxShadow: `6px 6px 0 ${PALETTE.edge}, 0 0 24px rgba(255, 207, 64, 0.8)`,
          animation: prefersReducedMotion ? 'none' : 'retroPopup 1200ms steps(8) forwards',
        }}
      >
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            color: PALETTE.sky,
            marginBottom: '8px',
            letterSpacing: '1px',
          }}
        >
          ★ QUEST COMPLETE ★
        </div>

        <div
          className="font-pixel-heading"
          style={{
            fontSize: '28px',
            color: PALETTE.gold,
            lineHeight: 1.2,
            letterSpacing: '2px',
            textShadow: `3px 3px 0 ${PALETTE.edge}`,
            marginBottom: '8px',
          }}
        >
          LEVEL UP!
        </div>

        <div
          style={{
            fontFamily: "'Silkscreen', monospace",
            fontSize: '13px',
            color: PALETTE.parchment,
          }}
        >
          +250 XP • SPRINT ADVANCED
        </div>
      </div>

      <style>{`
        @keyframes retroPopup {
          0% {
            transform: scale(0.6) translateY(20px);
            opacity: 0;
          }
          15% {
            transform: scale(1.1) translateY(0);
            opacity: 1;
          }
          30% {
            transform: scale(1.0);
            opacity: 1;
          }
          85% {
            transform: scale(1.0);
            opacity: 1;
          }
          100% {
            transform: scale(0.9) translateY(-16px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
