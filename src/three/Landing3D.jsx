/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import * as THREE from 'three';
import {
  PALETTE,
  useSystemCapabilities,
  CSSFallbackScreen,
  PixelStars,
  PixelClouds,
  PixelFireflies,
  FloatingIsland,
  SprintCastle,
  QuestBoard,
  VaultChest,
  VoxelMascot,
} from './LoomyWorld.jsx';
import './fallback.css';

// Lazy-load the Three.js Canvas to reduce initial bundle execution
const LazyCanvasScene = lazy(() =>
  import('@react-three/fiber').then((r3f) => ({
    default: function CanvasScene({ isMobile, dollyMode, tabVisible, pointerPos }) {
      const { Canvas, useFrame } = r3f;

      function SceneRig() {
        const islandGroupRef = useRef();

        useFrame((state, delta) => {
          // Camera Dolly and Parallax
          if (dollyMode) {
            const targetZ = dollyMode === 'start' ? -0.4 : 1.6;
            const targetY = 1.3;
            const targetX = 0;
            state.camera.position.x = THREE.MathUtils.damp(
              state.camera.position.x,
              targetX,
              dollyMode === 'start' ? 5.5 : 8.0,
              delta
            );
            state.camera.position.y = THREE.MathUtils.damp(
              state.camera.position.y,
              targetY,
              dollyMode === 'start' ? 5.5 : 8.0,
              delta
            );
            state.camera.position.z = THREE.MathUtils.damp(
              state.camera.position.z,
              targetZ,
              dollyMode === 'start' ? 5.5 : 8.0,
              delta
            );
            state.camera.lookAt(0, 1.4, -2.5);
          } else {
            // Clamped mouse parallax orbit (no user zoom or pan)
            const baseX = 0;
            const baseY = isMobile ? 3.6 : 3.0;
            const baseZ = isMobile ? 10.4 : 8.6;

            const targetX = baseX + pointerPos.x * 0.9;
            const targetY = baseY + pointerPos.y * 0.5;
            state.camera.position.x = THREE.MathUtils.damp(
              state.camera.position.x,
              targetX,
              3.5,
              delta
            );
            state.camera.position.y = THREE.MathUtils.damp(
              state.camera.position.y,
              targetY,
              3.5,
              delta
            );
            state.camera.position.z = THREE.MathUtils.damp(
              state.camera.position.z,
              baseZ,
              3.5,
              delta
            );

            const lookTargetY = isMobile ? 0.8 : 0.6;
            state.camera.lookAt(0, lookTargetY, -0.6);
          }

          // Slow idle float on the island
          if (islandGroupRef.current) {
            const t = state.clock.getElapsedTime();
            islandGroupRef.current.position.y = Math.sin(t * 1.2) * 0.12;
          }
        });

        return (
          <group ref={islandGroupRef} position={[0, isMobile ? 0.4 : 0, 0]}>
            <FloatingIsland />
            <SprintCastle />
            <QuestBoard />
            <VaultChest />
            <VoxelMascot />
            <PixelFireflies count={isMobile ? 16 : 28} />
          </group>
        );
      }

      return (
        <Canvas
          aria-hidden="true"
          className="pixel-canvas"
          dpr={[0.5, 0.75]}
          frameloop={tabVisible ? 'always' : 'never'}
          camera={{
            position: [0, isMobile ? 3.6 : 3.0, isMobile ? 10.4 : 8.6],
            fov: isMobile ? 48 : 42,
            near: 0.1,
            far: 60,
          }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
          }}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
          }}
        >
          {/* Deep RPG Night Sky Fog */}
          <color attach="background" args={[PALETTE.ink]} />
          <fog attach="fog" args={[PALETTE.ink, 14, 38]} />

          {/* Key lights with warm/cool contrast */}
          <ambientLight color={PALETTE.night} intensity={0.9} />
          <directionalLight
            position={[6, 12, 8]}
            color={PALETTE.parchment}
            intensity={1.8}
          />
          <directionalLight
            position={[-8, 6, -6]}
            color={PALETTE.sky}
            intensity={0.7}
          />

          <PixelStars count={isMobile ? 70 : 140} />
          <PixelClouds count={isMobile ? 18 : 35} />
          <SceneRig />
        </Canvas>
      );
    },
  }))
);

// Typewriter hook for retro dialogue
function useTypewriter(fullText, speed = 45, startDelay = 250) {
  const [displayed, setDisplayed] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let timeoutId;
    let index = 0;
    setDisplayed('');
    setComplete(false);

    timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        index++;
        setDisplayed(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(intervalId);
          setComplete(true);
        }
      }, speed);
      return () => clearInterval(intervalId);
    }, startDelay);

    return () => clearTimeout(timeoutId);
  }, [fullText, speed, startDelay]);

  return { displayed, complete };
}

// ============================================================================
// EXPORT: <Landing3D onStart onLogin />
// ============================================================================
export default function Landing3D({ onStart, onLogin }) {
  const { hasWebGL, prefersReducedMotion, isMobile, tabVisible } =
    useSystemCapabilities();

  // Mouse parallax coordinates (normalized -1 to 1)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

  // Camera Dolly State ('start' | 'login' | null)
  const [dollyMode, setDollyMode] = useState(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Typewriter speech bubble
  const { displayed: speechText, complete: typingDone } = useTypewriter(
    'Hail, traveler! Ready to ship?'
  );

  // Handle subtle mouse parallax
  const handlePointerMove = (e) => {
    if (prefersReducedMotion || dollyMode) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    setPointerPos({ x: nx, y: ny });
  };

  // Start Quest Click -> 0.8s camera dolly toward castle gate + pixel fade-to-night
  const handleStartQuest = () => {
    if (dollyMode) return;
    setDollyMode('start');
    setFadeOpacity(1);
    setTimeout(() => {
      if (onStart) onStart();
    }, 800);
  };

  // Log In Click -> 0.4s camera dolly toward castle gate + pixel fade-to-night
  const handleLogin = () => {
    if (dollyMode) return;
    setDollyMode('login');
    setFadeOpacity(1);
    setTimeout(() => {
      if (onLogin) onLogin();
    }, 400);
  };

  const useFallback = !hasWebGL || prefersReducedMotion;

  return (
    <div
      onMouseMove={handlePointerMove}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: PALETTE.ink,
        color: PALETTE.parchment,
        fontFamily: "'Silkscreen', monospace",
        overflowX: 'hidden',
      }}
    >
      {/* 3D Scene Layer (Fixed behind the scrollable HTML content) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {useFallback ? (
          <CSSFallbackScreen message="16-Bit Realm (Static Mode)" />
        ) : (
          <Suspense fallback={<CSSFallbackScreen message="Conjuring Island..." />}>
            <LazyCanvasScene
              isMobile={isMobile}
              dollyMode={dollyMode}
              tabVisible={tabVisible}
              pointerPos={pointerPos}
            />
          </Suspense>
        )}
      </div>

      {/* Camera Dolly Pixel Fade to Night Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: PALETTE.ink,
          opacity: fadeOpacity,
          transition: `opacity ${dollyMode === 'start' ? '750ms' : '380ms'} steps(8)`,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* HTML Overlay (pointer-events: none on wrapper, auto on buttons/cards) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'none',
        }}
      >
        {/* Top Navigation Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '16px 20px' : '24px 40px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            {/* Voxel Logo Icon */}
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: PALETTE.gold,
                border: `3px solid ${PALETTE.edge}`,
                boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '12px',
                color: PALETTE.edge,
                fontWeight: 'bold',
              }}
            >
              L
            </div>
            <span
              className="font-pixel-heading"
              style={{
                fontSize: isMobile ? '16px' : '20px',
                color: PALETTE.gold,
                letterSpacing: '1px',
                textShadow: `2px 2px 0 ${PALETTE.edge}`,
              }}
            >
              LOOMY
            </span>
            <span
              className="pixel-badge"
              style={{
                backgroundColor: PALETTE.panel,
                color: PALETTE.sky,
                display: isMobile ? 'none' : 'inline-block',
              }}
            >
              AES-256 VAULT
            </span>
          </div>

          <div style={{ pointerEvents: 'auto' }}>
            <button
              onClick={handleLogin}
              className="pixel-btn pixel-btn-ghost"
              style={{
                fontSize: '10px',
                padding: '10px 16px',
                minHeight: '44px',
              }}
            >
              LOG IN
            </button>
          </div>
        </header>

        {/* Hero Section (Above the fold) */}
        <main
          style={{
            flex: '1 0 auto',
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isMobile ? 'flex-start' : 'center',
            alignItems: isMobile ? 'center' : 'flex-start',
            padding: isMobile ? '24px 20px' : '0 64px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Mascot Speech Bubble */}
          <div
            className="pixel-speech-bubble"
            style={{
              marginBottom: '28px',
              maxWidth: '380px',
              pointerEvents: 'auto',
              border: `4px solid ${PALETTE.edge}`,
              boxShadow: `4px 4px 0 ${PALETTE.edge}`,
            }}
          >
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: PALETTE.plum,
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}
            >
              [MASCOT MAGE]
            </div>
            <p
              style={{
                fontFamily: "'Silkscreen', monospace",
                fontSize: '13px',
                lineHeight: '1.4',
                color: PALETTE.edge,
                margin: 0,
                minHeight: '36px',
              }}
            >
              {speechText}
              {!typingDone && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '14px',
                    backgroundColor: PALETTE.edge,
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </p>
          </div>

          {/* Main Headline & Subtitle */}
          <div
            style={{
              maxWidth: '680px',
              textAlign: isMobile ? 'center' : 'left',
              pointerEvents: 'auto',
            }}
          >
            <h1
              className="font-pixel-heading"
              style={{
                fontSize: isMobile ? '20px' : '36px',
                lineHeight: 1.35,
                color: PALETTE.parchment,
                marginBottom: '16px',
                textShadow: `3px 3px 0 ${PALETTE.edge}, 5px 5px 0 ${PALETTE.ink}`,
              }}
            >
              Ship your sprint like a{' '}
              <span style={{ color: PALETTE.gold }}>quest log.</span>
            </h1>

            <p
              style={{
                fontSize: isMobile ? '13px' : '16px',
                lineHeight: 1.6,
                color: PALETTE.parchment,
                opacity: 0.92,
                marginBottom: '32px',
                textShadow: `2px 2px 0 ${PALETTE.edge}`,
              }}
            >
              Sprint board, encrypted secrets vault and XP for dev teams.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              <button
                onClick={handleStartQuest}
                className="pixel-btn pixel-btn-gold"
                style={{
                  fontSize: isMobile ? '11px' : '13px',
                  padding: '14px 28px',
                  minHeight: '48px',
                }}
              >
                START QUEST
              </button>

              <button
                onClick={handleLogin}
                className="pixel-btn pixel-btn-ghost"
                style={{
                  fontSize: isMobile ? '11px' : '13px',
                  padding: '14px 24px',
                  minHeight: '48px',
                }}
              >
                LOG IN
              </button>
            </div>
          </div>

          {/* Scroll prompt */}
          <div
            style={{
              marginTop: '48px',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              color: PALETTE.gold,
              letterSpacing: '1px',
              opacity: 0.85,
              textShadow: `2px 2px 0 ${PALETTE.edge}`,
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>▼</span> SCROLL FOR REALM ARCHITECTURE <span>▼</span>
          </div>
        </main>

        {/* Below the Fold: Feature Cards & RPG Class Row */}
        <section
          style={{
            width: '100%',
            padding: isMobile ? '48px 20px 80px' : '72px 48px 100px',
            backgroundColor: 'rgba(20, 18, 43, 0.85)',
            borderTop: `4px solid ${PALETTE.edge}`,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div
                className="pixel-badge"
                style={{
                  backgroundColor: PALETTE.panel,
                  color: PALETTE.gold,
                  marginBottom: '12px',
                }}
              >
                SYSTEM SPECIFICATIONS
              </div>
              <h2
                className="font-pixel-heading"
                style={{
                  fontSize: isMobile ? '16px' : '22px',
                  color: PALETTE.parchment,
                  margin: 0,
                  textShadow: `2px 2px 0 ${PALETTE.edge}`,
                }}
              >
                EQUIPPED FOR PRODUCTION RAIDS
              </h2>
            </div>

            {/* 3 Small Feature Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '56px',
              }}
            >
              {/* Card 1: Sprint Board */}
              <div
                className="pixel-panel"
                style={{
                  padding: '24px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: PALETTE.sky,
                    border: `3px solid ${PALETTE.edge}`,
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: PALETTE.edge,
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  ⚔
                </div>
                <h3
                  className="font-pixel-heading"
                  style={{
                    fontSize: '12px',
                    color: PALETTE.gold,
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  Sprint Board
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: PALETTE.parchment,
                    margin: 0,
                  }}
                >
                  Transform Jira drag-and-drop fatigue into heroic dungeon quests.
                  Multi-column Kanban with instant loot rewards.
                </p>
              </div>

              {/* Card 2: Secrets Vault */}
              <div
                className="pixel-panel"
                style={{
                  padding: '24px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: PALETTE.gold,
                    border: `3px solid ${PALETTE.edge}`,
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: PALETTE.edge,
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  🗝
                </div>
                <h3
                  className="font-pixel-heading"
                  style={{
                    fontSize: '12px',
                    color: PALETTE.gold,
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  Secrets Vault
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: PALETTE.parchment,
                    margin: 0,
                  }}
                >
                  AES-256 client-side encrypted repository for environment secrets,
                  keys, and tokens. Zero server leaks.
                </p>
              </div>

              {/* Card 3: Quest XP */}
              <div
                className="pixel-panel"
                style={{
                  padding: '24px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: PALETTE.grass,
                    border: `3px solid ${PALETTE.edge}`,
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: PALETTE.edge,
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  ★
                </div>
                <h3
                  className="font-pixel-heading"
                  style={{
                    fontSize: '12px',
                    color: PALETTE.gold,
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  Quest XP
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: PALETTE.parchment,
                    margin: 0,
                  }}
                >
                  Gamify sprint velocity. Level up dev stats, unlock hero titles,
                  and celebrate commits with team achievements.
                </p>
              </div>
            </div>

            {/* RPG Class Row */}
            <div
              className="pixel-panel-night"
              style={{
                padding: isMobile ? '24px 16px' : '32px 28px',
                border: `4px solid ${PALETTE.edge}`,
                boxShadow: `4px 4px 0 ${PALETTE.edge}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <h3
                  className="font-pixel-heading"
                  style={{
                    fontSize: isMobile ? '12px' : '15px',
                    color: PALETTE.gold,
                    margin: 0,
                  }}
                >
                  PICK YOUR CLASS
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    color: PALETTE.parchment,
                    opacity: 0.8,
                  }}
                >
                  Role-based permissions mapped to RPG archetypes
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '16px',
                }}
              >
                {/* Admin */}
                <div
                  style={{
                    backgroundColor: PALETTE.panel,
                    border: `3px solid ${PALETTE.edge}`,
                    padding: '16px',
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '10px',
                      color: PALETTE.plum,
                      marginBottom: '8px',
                    }}
                  >
                    [ADMIN]
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: PALETTE.gold,
                      fontWeight: 'bold',
                      marginBottom: '6px',
                    }}
                  >
                    The Grand Overseer
                  </div>
                  <div style={{ fontSize: '12px', color: PALETTE.parchment, opacity: 0.9 }}>
                    Grants project realms and guards vault seals. Full team administration.
                  </div>
                </div>

                {/* Lead */}
                <div
                  style={{
                    backgroundColor: PALETTE.panel,
                    border: `3px solid ${PALETTE.edge}`,
                    padding: '16px',
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '10px',
                      color: PALETTE.sky,
                      marginBottom: '8px',
                    }}
                  >
                    [LEAD]
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: PALETTE.gold,
                      fontWeight: 'bold',
                      marginBottom: '6px',
                    }}
                  >
                    The Guild Tactician
                  </div>
                  <div style={{ fontSize: '12px', color: PALETTE.parchment, opacity: 0.9 }}>
                    Allocates story points and routes raid milestones. Sprint pacing captain.
                  </div>
                </div>

                {/* Developer */}
                <div
                  style={{
                    backgroundColor: PALETTE.panel,
                    border: `3px solid ${PALETTE.edge}`,
                    padding: '16px',
                    boxShadow: `3px 3px 0 ${PALETTE.edge}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '10px',
                      color: PALETTE.grass,
                      marginBottom: '8px',
                    }}
                  >
                    [DEVELOPER]
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: PALETTE.gold,
                      fontWeight: 'bold',
                      marginBottom: '6px',
                    }}
                  >
                    The Code Champion
                  </div>
                  <div style={{ fontSize: '12px', color: PALETTE.parchment, opacity: 0.9 }}>
                    Crushes backlog bugs and claims pull request glory. Frontline quest completer.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer
              style={{
                marginTop: '48px',
                textAlign: 'center',
                fontSize: '11px',
                color: PALETTE.parchment,
                opacity: 0.7,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <span>LOOMY v1.0.0 • 16-BIT VOXEL ENGINE</span>
              <span>AES-256 GCM SECRETS ENCRYPTION</span>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
