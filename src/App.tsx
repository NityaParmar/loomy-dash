/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Landing3D from './three/Landing3D.jsx';
import AuthBackdrop from './three/AuthBackdrop.jsx';
import VoxelAvatar from './three/VoxelAvatar.jsx';
import LevelUpBurst from './three/LevelUpBurst.jsx';
import { PALETTE } from './three/LoomyWorld.jsx';
import './three/fallback.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'avatars' | 'sprint'
  const [selectedHero, setSelectedHero] = useState('mage');
  const [levelUpTrigger, setLevelUpTrigger] = useState(false);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [logNotice, setLogNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setLogNotice(msg);
    setTimeout(() => {
      setLogNotice(null);
    }, 3200);
  };

  const handleStartQuest = () => {
    showToast('onStart() triggered! Transitioning to Hero Select...');
    setTimeout(() => {
      setCurrentView('avatars');
    }, 400);
  };

  const handleLogin = () => {
    showToast('onLogin() triggered! Transitioning to Auth Screen...');
    setTimeout(() => {
      setCurrentView('auth');
    }, 400);
  };

  const triggerLevelUp = () => {
    setLevelUpTrigger(true);
    // Reset trigger quickly so it can be re-fired
    setTimeout(() => setLevelUpTrigger(false), 200);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: PALETTE.ink,
        color: PALETTE.parchment,
        fontFamily: "'Silkscreen', monospace",
        overflowX: 'hidden',
      }}
    >
      {/* Global LevelUpBurst Component */}
      <LevelUpBurst trigger={levelUpTrigger} />

      {/* Floating View Switcher Bar (Demo Harness for all 4 Deliverables) */}
      <nav
        aria-label="Component Showcase Switcher"
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          backgroundColor: 'rgba(20, 18, 43, 0.95)',
          padding: '6px 10px',
          border: `3px solid ${PALETTE.edge}`,
          boxShadow: `3px 3px 0 ${PALETTE.edge}`,
          flexWrap: 'wrap',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            color: PALETTE.gold,
            marginRight: '4px',
          }}
        >
          VIEW:
        </span>

        <button
          onClick={() => setCurrentView('landing')}
          className={`pixel-btn ${currentView === 'landing' ? 'pixel-btn-gold' : 'pixel-btn-ghost'}`}
          style={{
            fontSize: '8px',
            padding: '6px 10px',
            minHeight: '32px',
          }}
        >
          1. LANDING
        </button>

        <button
          onClick={() => setCurrentView('auth')}
          className={`pixel-btn ${currentView === 'auth' ? 'pixel-btn-gold' : 'pixel-btn-ghost'}`}
          style={{
            fontSize: '8px',
            padding: '6px 10px',
            minHeight: '32px',
          }}
        >
          2. AUTH BACKDROP
        </button>

        <button
          onClick={() => setCurrentView('avatars')}
          className={`pixel-btn ${currentView === 'avatars' ? 'pixel-btn-gold' : 'pixel-btn-ghost'}`}
          style={{
            fontSize: '8px',
            padding: '6px 10px',
            minHeight: '32px',
          }}
        >
          3. AVATARS
        </button>

        <button
          onClick={triggerLevelUp}
          className="pixel-btn pixel-btn-plum"
          style={{
            fontSize: '8px',
            padding: '6px 10px',
            minHeight: '32px',
          }}
        >
          4. BURST (XP!)
        </button>
      </nav>

      {/* Floating Notice Toast */}
      {logNotice && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9000,
            backgroundColor: PALETTE.panel,
            color: PALETTE.gold,
            border: `4px solid ${PALETTE.edge}`,
            boxShadow: `4px 4px 0 ${PALETTE.edge}`,
            padding: '12px 24px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            textAlign: 'center',
            maxWidth: '90vw',
          }}
        >
          {logNotice}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DELIVERABLE 1: LANDING PAGE 3D SCENE & OVERLAY                       */}
      {/* -------------------------------------------------------------------- */}
      {currentView === 'landing' && (
        <Landing3D
          onStart={handleStartQuest}
          onLogin={handleLogin}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DELIVERABLE 2: AUTH BACKDROP (Calm world behind interactive form)     */}
      {/* -------------------------------------------------------------------- */}
      {currentView === 'auth' && (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
          {/* Calm AuthBackdrop fixed behind */}
          <AuthBackdrop />

          {/* Foreground Form (Proving clicks & typing are NOT blocked) */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
            }}
          >
            <div
              className="pixel-panel"
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '32px 28px',
                backgroundColor: PALETTE.night,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  className="pixel-badge"
                  style={{
                    backgroundColor: PALETTE.panel,
                    color: PALETTE.gold,
                    marginBottom: '10px',
                  }}
                >
                  AES-256 VAULT ACCESS
                </div>
                <h2
                  className="font-pixel-heading"
                  style={{
                    fontSize: '18px',
                    color: PALETTE.parchment,
                    margin: 0,
                  }}
                >
                  ENTER THE REALM
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: PALETTE.parchment,
                    opacity: 0.8,
                    marginTop: '8px',
                  }}
                >
                  AuthBackdrop stays fixed behind and never intercepts clicks.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast('Authentication credentials verified!');
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label
                    htmlFor="hero-email"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: PALETTE.gold,
                      marginBottom: '6px',
                    }}
                  >
                    HERO IDENTITY (EMAIL)
                  </label>
                  <input
                    id="hero-email"
                    type="email"
                    defaultValue="mage@loomy.dev"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: PALETTE.ink,
                      border: `3px solid ${PALETTE.edge}`,
                      color: PALETTE.parchment,
                      fontFamily: "'Silkscreen', monospace",
                      fontSize: '13px',
                      outline: 'none',
                      borderRadius: 0,
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="vault-key"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: PALETTE.gold,
                      marginBottom: '6px',
                    }}
                  >
                    VAULT MASTER PASSPHRASE
                  </label>
                  <input
                    id="vault-key"
                    type="password"
                    defaultValue="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: PALETTE.ink,
                      border: `3px solid ${PALETTE.edge}`,
                      color: PALETTE.parchment,
                      fontFamily: "'Silkscreen', monospace",
                      fontSize: '13px',
                      outline: 'none',
                      borderRadius: 0,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="pixel-btn pixel-btn-gold"
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    padding: '14px',
                    minHeight: '48px',
                  }}
                >
                  DECRYPT &amp; ENTER
                </button>

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    fontSize: '11px',
                    color: PALETTE.parchment,
                    opacity: 0.8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentView('landing')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: PALETTE.sky,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontFamily: "'Silkscreen', monospace",
                      fontSize: '11px',
                      padding: 0,
                    }}
                  >
                    ← Return to Quest Gate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DELIVERABLE 3: VOXEL AVATAR ("CHOOSE YOUR HERO" SCREEN)               */}
      {/* -------------------------------------------------------------------- */}
      {currentView === 'avatars' && (
        <div
          style={{
            minHeight: '100vh',
            padding: '72px 24px 64px',
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div
              className="pixel-badge"
              style={{
                backgroundColor: PALETTE.panel,
                color: PALETTE.gold,
                marginBottom: '12px',
              }}
            >
              POST-SIGNUP ONBOARDING
            </div>
            <h1
              className="font-pixel-heading"
              style={{
                fontSize: '22px',
                color: PALETTE.gold,
                marginBottom: '12px',
                textShadow: `3px 3px 0 ${PALETTE.edge}`,
              }}
            >
              CHOOSE YOUR HERO
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: PALETTE.parchment,
                maxWidth: '560px',
              }}
            >
              4 distinct voxel silhouettes with continuous spin and gold highlight ring.
            </p>

            {/* Toggle spin */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => setSpinEnabled((v) => !v)}
                className="pixel-btn pixel-btn-ghost"
                style={{
                  fontSize: '9px',
                  padding: '8px 14px',
                  minHeight: '36px',
                }}
              >
                SPIN: {spinEnabled ? 'ENABLED (ON)' : 'PAUSED (OFF)'}
              </button>
            </div>
          </div>

          {/* 4 Voxel Avatar Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              width: '100%',
              marginBottom: '40px',
            }}
          >
            {[
              {
                type: 'knight' as const,
                name: 'KNIGHT',
                role: 'Guardian of Secrets',
                desc: 'Shield of the Realm & Cryptographic Armor',
                color: PALETTE.blood,
              },
              {
                type: 'mage' as const,
                name: 'MAGE',
                role: 'Staff of Compiles',
                desc: 'Arcane Algorithms & Golden Runes',
                color: PALETTE.plum,
              },
              {
                type: 'rogue' as const,
                name: 'ROGUE',
                role: 'Shadow Bug Hunter',
                desc: 'Dual-blade Hotfixes & Stealth PRs',
                color: PALETTE.edge,
              },
              {
                type: 'ranger' as const,
                name: 'RANGER',
                role: 'Sprint Scout',
                desc: 'Longbow Story Points & Milestone Tracking',
                color: PALETTE.grass,
              },
            ].map((hero) => {
              const isSelected = selectedHero === hero.type;
              return (
                <div
                  key={hero.type}
                  onClick={() => {
                    setSelectedHero(hero.type);
                    showToast(`Selected Class: ${hero.name}`);
                  }}
                  className="pixel-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? PALETTE.panel : PALETTE.night,
                    border: `4px solid ${isSelected ? PALETTE.gold : PALETTE.edge}`,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1.0)',
                    transition: 'transform 100ms steps(2), border 100ms steps(2)',
                  }}
                >
                  {/* Miniature VoxelAvatar Component */}
                  <VoxelAvatar
                    type={hero.type}
                    size={160}
                    spin={spinEnabled}
                    selected={isSelected}
                  />

                  <div
                    className="font-pixel-heading"
                    style={{
                      fontSize: '12px',
                      color: isSelected ? PALETTE.gold : PALETTE.parchment,
                      marginTop: '16px',
                      marginBottom: '6px',
                    }}
                  >
                    {hero.name}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: PALETTE.sky,
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {hero.role}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: PALETTE.parchment,
                      opacity: 0.8,
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {hero.desc}
                  </div>

                  <button
                    type="button"
                    className={`pixel-btn ${isSelected ? 'pixel-btn-gold' : 'pixel-btn-ghost'}`}
                    style={{
                      marginTop: '14px',
                      fontSize: '9px',
                      padding: '8px 12px',
                      width: '100%',
                      minHeight: '38px',
                    }}
                  >
                    {isSelected ? 'EQUIPPED' : 'CHOOSE'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                showToast(`Hero confirmed! Leveling up ${selectedHero.toUpperCase()}...`);
                triggerLevelUp();
              }}
              className="pixel-btn pixel-btn-gold"
              style={{
                fontSize: '12px',
                padding: '14px 28px',
                minHeight: '48px',
              }}
            >
              CONFIRM {selectedHero.toUpperCase()} &amp; ENTER
            </button>
            <button
              onClick={() => setCurrentView('landing')}
              className="pixel-btn pixel-btn-ghost"
              style={{
                fontSize: '11px',
                padding: '14px 20px',
                minHeight: '48px',
              }}
            >
              BACK TO LANDING
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
