/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import {
  PALETTE,
  useSystemCapabilities,
  VoxelCharacter,
} from './LoomyWorld.jsx';
import './fallback.css';

// Lazy-loaded miniature canvas for avatar
const LazyAvatarCanvas = lazy(() =>
  import('@react-three/fiber').then((r3f) => ({
    default: function AvatarCanvas({ type, spin, selected, tabVisible }) {
      const { Canvas } = r3f;

      return (
        <Canvas
          aria-hidden="true"
          className="pixel-canvas"
          dpr={[0.6, 0.8]}
          frameloop={tabVisible ? 'always' : 'never'}
          camera={{
            position: [0, 1.0, 3.8],
            fov: 34,
            near: 0.1,
            far: 20,
          }}
          gl={{
            antialias: false,
            powerPreference: 'low-power',
          }}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Studio Lights */}
          <ambientLight color={PALETTE.night} intensity={0.9} />
          <directionalLight
            position={[4, 6, 5]}
            color={PALETTE.parchment}
            intensity={1.6}
          />
          <directionalLight
            position={[-4, 2, -3]}
            color={PALETTE.sky}
            intensity={0.6}
          />

          <VoxelCharacter type={type} selected={selected} spin={spin} />
        </Canvas>
      );
    },
  }))
);

// Fallback 2D Pixel Icon if WebGL is unavailable or during loading
function AvatarFallback({ type, selected }) {
  const icons = {
    knight: '🛡️',
    mage: '🔮',
    rogue: '🗡️',
    ranger: '🏹',
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PALETTE.panel,
        color: selected ? PALETTE.gold : PALETTE.parchment,
        border: `3px solid ${selected ? PALETTE.gold : PALETTE.edge}`,
      }}
    >
      <span style={{ fontSize: '36px' }}>{icons[type] || '🧙'}</span>
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '8px',
          marginTop: '8px',
          textTransform: 'uppercase',
        }}
      >
        {type}
      </span>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {'knight' | 'mage' | 'rogue' | 'ranger'} [props.type]
 * @param {number | string} [props.size]
 * @param {boolean} [props.spin]
 * @param {boolean} [props.selected]
 * @param {(() => void) | undefined} [props.onClick]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
export default function VoxelAvatar({
  type = 'mage',
  size = 160,
  spin = true,
  selected = false,
  onClick = undefined,
  className = '',
  style = {},
}) {
  const { hasWebGL, prefersReducedMotion, tabVisible } = useSystemCapabilities();

  const width = typeof size === 'number' ? `${size}px` : size;
  const height = width;

  const validTypes = ['knight', 'mage', 'rogue', 'ranger'];
  const characterType = validTypes.includes(type) ? type : 'mage';

  const useFallback = !hasWebGL;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${characterType} voxel hero avatar${selected ? ' (selected)' : ''}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`pixel-avatar-wrapper ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        backgroundColor: PALETTE.night,
        border: `4px solid ${selected ? PALETTE.gold : PALETTE.edge}`,
        boxShadow: selected
          ? `4px 4px 0 ${PALETTE.edge}, 0 0 12px rgba(255, 207, 64, 0.5)`
          : `4px 4px 0 ${PALETTE.edge}`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        outline: 'none',
        display: 'inline-block',
        overflow: 'hidden',
        transition: 'border-color 120ms steps(2), box-shadow 120ms steps(2)',
        ...style,
      }}
    >
      {/* 3D Scene or Fallback */}
      {useFallback ? (
        <AvatarFallback type={characterType} selected={selected} />
      ) : (
        <Suspense
          fallback={<AvatarFallback type={characterType} selected={selected} />}
        >
          <LazyAvatarCanvas
            type={characterType}
            spin={spin && !prefersReducedMotion}
            selected={selected}
            tabVisible={tabVisible}
          />
        </Suspense>
      )}

      {/* Selected Indicator Ribbon */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: PALETTE.gold,
            color: PALETTE.edge,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7px',
            padding: '2px 4px',
            border: `2px solid ${PALETTE.edge}`,
            boxShadow: `2px 2px 0 ${PALETTE.edge}`,
            pointerEvents: 'none',
          }}
        >
          ACTIVE
        </div>
      )}
    </div>
  );
}
