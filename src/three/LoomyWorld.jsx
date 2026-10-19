/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ============================================================================
// STRICT PALETTE (Only these 10 colors permitted)
// ============================================================================
export const PALETTE = {
  ink: '#14122b',
  night: '#1d1a45',
  panel: '#2a2562',
  edge: '#0b0a1d',
  parchment: '#f4e8c1',
  gold: '#ffcf40',
  grass: '#59c26b',
  blood: '#e8505b',
  sky: '#4cb4ff',
  plum: '#b06cff',
};

// Scratch objects to prevent garbage collection in render loops
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// ============================================================================
// SYSTEM CAPABILITIES & ACCESSIBILITY HOOK
// ============================================================================
export function useSystemCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasWebGL: true,
    prefersReducedMotion: false,
    isMobile: false,
    tabVisible: true,
  });

  useEffect(() => {
    // 1. Detect WebGL support safely
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    // 2. Reduced motion media query
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => {
      setCapabilities((prev) => ({ ...prev, prefersReducedMotion: e.matches }));
    };

    // 3. Screen size / low-power detection
    const handleResize = () => {
      setCapabilities((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 768,
      }));
    };

    // 4. Tab visibility pause
    const handleVisibility = () => {
      setCapabilities((prev) => ({
        ...prev,
        tabVisible: document.visibilityState === 'visible',
      }));
    };

    const hasSupport = checkWebGL();
    setCapabilities({
      hasWebGL: hasSupport,
      prefersReducedMotion: motionQuery.matches,
      isMobile: window.innerWidth < 768,
      tabVisible: document.visibilityState === 'visible',
    });

    motionQuery.addEventListener('change', handleMotionChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return capabilities;
}

// ============================================================================
// CSS-ONLY FALLBACK SCREEN (For loading, no-WebGL, or prefers-reduced-motion)
// ============================================================================
export function CSSFallbackScreen({ message = 'Loading 16-Bit Realm...' }) {
  return (
    <div className="pixel-fallback-container" role="img" aria-label="16-bit voxel landscape fallback">
      <div className="pixel-fallback-stars" />
      <div className="pixel-fallback-island">
        <div className="pixel-fallback-castle">
          <div className="pixel-fallback-gate" />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: PALETTE.panel,
          color: PALETTE.gold,
          padding: '8px 16px',
          border: `4px solid ${PALETTE.edge}`,
          boxShadow: `4px 4px 0 ${PALETTE.edge}`,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        {message}
      </div>
    </div>
  );
}

// ============================================================================
// PROCEDURAL SHARED MATERIALS (Flat Shaded MeshLambert)
// ============================================================================
export const voxelBoxGeo = new THREE.BoxGeometry(1, 1, 1);

// ============================================================================
// 1. INSTANCED STARS (Twinkling in discrete steps)
// ============================================================================
export function PixelStars({ count = 140, reduced = false }) {
  const meshRef = useRef();
  const starCount = reduced ? 60 : count;

  const starData = useMemo(() => {
    const data = [];
    for (let i = 0; i < starCount; i++) {
      // Hemisphere distribution above the island
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.45);
      const radius = 22 + Math.random() * 14;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) + 2;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const baseScale = 0.2 + Math.random() * 0.25;
      const stepOffset = Math.random() * 10;
      const speed = 1.5 + Math.random() * 2;

      // Color pick from palette: gold, parchment, sky
      const paletteColors = [PALETTE.gold, PALETTE.parchment, PALETTE.sky];
      const color = paletteColors[i % paletteColors.length];

      data.push({ x, y, z, baseScale, stepOffset, speed, color });
    }
    return data;
  }, [starCount]);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < starData.length; i++) {
      const s = starData[i];
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.scale.set(s.baseScale, s.baseScale, s.baseScale);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
      _color.set(s.color);
      meshRef.current.setColorAt(i, _color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [starData]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    let updated = false;

    for (let i = 0; i < starData.length; i++) {
      const s = starData[i];
      // 16-bit stepped twinkle (quantized frames)
      const stepVal = Math.floor((t * s.speed + s.stepOffset) % 4);
      // Scale steps: 0.5, 1.0, 1.4, 0.8
      const stepMultiplier = stepVal === 0 ? 0.4 : stepVal === 1 ? 1.0 : stepVal === 2 ? 1.3 : 0.8;
      const currentScale = s.baseScale * stepMultiplier;

      _dummy.position.set(s.x, s.y, s.z);
      _dummy.scale.set(currentScale, currentScale, currentScale);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
      updated = true;
    }

    if (updated) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelBoxGeo, null, starCount]}
      frustumCulled={false}
    >
      <meshLambertMaterial flatShading />
    </instancedMesh>
  );
}

// ============================================================================
// 2. DRIFTING PIXEL CLOUDS (InstancedMesh)
// ============================================================================
export function PixelClouds({ count = 35 }) {
  const meshRef = useRef();

  // Generate clusters of voxels that form 5 chunky clouds
  const cloudData = useMemo(() => {
    const voxels = [];
    const cloudClusters = [
      { cx: -18, cy: 9, cz: -14, w: 5, h: 2, d: 3, speed: 0.35 },
      { cx: 12, cy: 11, cz: -18, w: 6, h: 2, d: 3, speed: 0.28 },
      { cx: -4, cy: 8, cz: -22, w: 7, h: 3, d: 4, speed: 0.32 },
      { cx: 20, cy: 7, cz: -10, w: 4, h: 2, d: 3, speed: 0.4 },
      { cx: -24, cy: 12, cz: -8, w: 5, h: 2, d: 3, speed: 0.25 },
    ];

    cloudClusters.forEach((cluster) => {
      for (let dx = -cluster.w / 2; dx <= cluster.w / 2; dx += 1.1) {
        for (let dy = 0; dy <= cluster.h; dy += 1) {
          for (let dz = -cluster.d / 2; dz <= cluster.d / 2; dz += 1.1) {
            // Irregular cloud shape
            if (Math.random() > 0.3) {
              voxels.push({
                cluster,
                relX: dx,
                relY: dy,
                relZ: dz,
                scale: 1.1 + Math.random() * 0.3,
                color: dy > 1 ? PALETTE.night : PALETTE.panel,
              });
            }
          }
        }
      }
    });

    return voxels.slice(0, count);
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    cloudData.forEach((v, i) => {
      _color.set(v.color);
      meshRef.current.setColorAt(i, _color);
    });
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [cloudData]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < cloudData.length; i++) {
      const v = cloudData[i];
      // Slow horizontal drift wrapping around
      let currentX = v.cluster.cx + (t * v.cluster.speed) % 50;
      if (currentX > 25) currentX -= 50;

      _dummy.position.set(
        currentX + v.relX,
        v.cluster.cy + v.relY,
        v.cluster.cz + v.relZ
      );
      _dummy.scale.set(v.scale, v.scale * 0.8, v.scale);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelBoxGeo, null, cloudData.length]}
      frustumCulled={false}
    >
      <meshLambertMaterial flatShading opacity={0.88} transparent />
    </instancedMesh>
  );
}

// ============================================================================
// 3. GOLD FIREFLIES ORBITING THE ISLAND (InstancedMesh)
// ============================================================================
export function PixelFireflies({ count = 28 }) {
  const meshRef = useRef();

  const fireflyData = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        radius: 3.5 + Math.random() * 4.5,
        baseY: 0.2 + Math.random() * 2.8,
        speed: (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
        bobSpeed: 1.2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        scale: 0.12 + Math.random() * 0.08,
      });
    }
    return list;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    _color.set(PALETTE.gold);
    for (let i = 0; i < fireflyData.length; i++) {
      meshRef.current.setColorAt(i, _color);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [fireflyData]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < fireflyData.length; i++) {
      const f = fireflyData[i];
      const angle = t * f.speed + f.phase;
      const x = Math.cos(angle) * f.radius;
      const z = Math.sin(angle) * f.radius - 0.5;
      // Quantized bobbing
      const bob = Math.sin(t * f.bobSpeed + f.phase) * 0.4;
      const y = f.baseY + bob;

      // Stepped pulse
      const pulse = 0.8 + 0.4 * Math.sin(t * 4 + f.phase);
      const s = f.scale * pulse;

      _dummy.position.set(x, y, z);
      _dummy.scale.set(s, s, s);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelBoxGeo, null, count]}
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

// ============================================================================
// 4. FLOATING VOXEL ISLAND (Tiered Grass, Stone Strata, Roots)
// ============================================================================
export function FloatingIsland() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Top Grass Deck */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8.4, 0.6, 8.4]} />
        <meshLambertMaterial color={PALETTE.grass} flatShading />
      </mesh>

      {/* Grass edge fringe voxels */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[8.8, 0.25, 8.8]} />
        <meshLambertMaterial color={PALETTE.grass} flatShading />
      </mesh>

      {/* Layer 1: Upper Dirt Strata */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[8.0, 0.7, 8.0]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Layer 2: Mid Stone Strata */}
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[7.0, 0.8, 7.0]} />
        <meshLambertMaterial color={PALETTE.night} flatShading />
      </mesh>

      {/* Layer 3: Lower Dark Rock */}
      <mesh position={[0, -2.2, 0]}>
        <boxGeometry args={[5.6, 0.8, 5.6]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>

      {/* Layer 4: Tapering Spire Root */}
      <mesh position={[0, -3.0, 0]}>
        <boxGeometry args={[3.8, 0.8, 3.8]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>
      <mesh position={[0.2, -3.8, -0.2]}>
        <boxGeometry args={[2.2, 0.8, 2.2]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[-0.1, -4.5, 0.1]}>
        <boxGeometry args={[1.0, 0.6, 1.0]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Cobblestone path toward castle gate */}
      <mesh position={[0, 0.32, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 3.6]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Voxel Trees / Shrubs */}
      {/* Tree Left */}
      <group position={[-3.2, 0.3, -1.5]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshLambertMaterial color={PALETTE.panel} flatShading />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[1.5, 1.0, 1.5]} />
          <meshLambertMaterial color={PALETTE.grass} flatShading />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[1.0, 0.8, 1.0]} />
          <meshLambertMaterial color={PALETTE.grass} flatShading />
        </mesh>
      </group>

      {/* Tree Right */}
      <group position={[3.3, 0.3, 1.2]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.35, 1.0, 0.35]} />
          <meshLambertMaterial color={PALETTE.panel} flatShading />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.3, 0.9, 1.3]} />
          <meshLambertMaterial color={PALETTE.grass} flatShading />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.8, 0.7, 0.8]} />
          <meshLambertMaterial color={PALETTE.grass} flatShading />
        </mesh>
      </group>

      {/* Small rock clusters */}
      <mesh position={[2.6, 0.45, -2.2]}>
        <boxGeometry args={[0.7, 0.5, 0.8]} />
        <meshLambertMaterial color={PALETTE.night} flatShading />
      </mesh>
      <mesh position={[-2.8, 0.45, 2.4]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshLambertMaterial color={PALETTE.night} flatShading />
      </mesh>
    </group>
  );
}

// ============================================================================
// 5. SPRINT CASTLE (With Golden Glowing Gate)
// ============================================================================
export function SprintCastle() {
  const gateRef = useRef();
  const lightRef = useRef();

  useFrame(({ clock }) => {
    if (!gateRef.current) return;
    const t = clock.getElapsedTime();
    // 16-bit stepped gold glow pulse
    const stepPulse = 0.8 + 0.3 * Math.floor(Math.sin(t * 3) * 2) * 0.25;
    if (gateRef.current.material) {
      gateRef.current.material.emissiveIntensity = 0.7 + stepPulse * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.0 + stepPulse * 1.5;
    }
  });

  return (
    <group position={[0, 0, -2.5]}>
      {/* Central Keep Body */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.2, 2.6, 2.4]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Central Keep Roof & Battlements */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[3.4, 0.4, 2.6]} />
        <meshLambertMaterial color={PALETTE.night} flatShading />
      </mesh>
      {/* Crenellations */}
      {[-1.3, -0.6, 0.1, 0.8, 1.3].map((x, i) => (
        <mesh key={`cren-${i}`} position={[x, 3.45, 1.2]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshLambertMaterial color={PALETTE.night} flatShading />
        </mesh>
      ))}

      {/* Left Tower */}
      <group position={[-1.9, 0, 0.2]}>
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[1.2, 3.2, 1.2]} />
          <meshLambertMaterial color={PALETTE.night} flatShading />
        </mesh>
        <mesh position={[0, 3.7, 0]}>
          <boxGeometry args={[1.4, 0.5, 1.4]} />
          <meshLambertMaterial color={PALETTE.panel} flatShading />
        </mesh>
        {/* Stepped Cone Roof */}
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[1.1, 0.5, 1.1]} />
          <meshLambertMaterial color={PALETTE.plum} flatShading />
        </mesh>
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshLambertMaterial color={PALETTE.plum} flatShading />
        </mesh>
        <mesh position={[0, 4.9, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.2]} />
          <meshLambertMaterial color={PALETTE.gold} flatShading />
        </mesh>
      </group>

      {/* Right Tower */}
      <group position={[1.9, 0, 0.2]}>
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[1.2, 3.2, 1.2]} />
          <meshLambertMaterial color={PALETTE.night} flatShading />
        </mesh>
        <mesh position={[0, 3.7, 0]}>
          <boxGeometry args={[1.4, 0.5, 1.4]} />
          <meshLambertMaterial color={PALETTE.panel} flatShading />
        </mesh>
        {/* Stepped Cone Roof */}
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[1.1, 0.5, 1.1]} />
          <meshLambertMaterial color={PALETTE.plum} flatShading />
        </mesh>
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshLambertMaterial color={PALETTE.plum} flatShading />
        </mesh>
        <mesh position={[0, 4.9, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.2]} />
          <meshLambertMaterial color={PALETTE.gold} flatShading />
        </mesh>
      </group>

      {/* Castle Gate Frame */}
      <mesh position={[0, 0.9, 1.22]}>
        <boxGeometry args={[1.6, 1.8, 0.2]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Glowing Gold Gate Aperture */}
      <mesh ref={gateRef} position={[0, 0.8, 1.26]}>
        <boxGeometry args={[1.1, 1.5, 0.1]} />
        <meshLambertMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={1.0}
          flatShading
        />
      </mesh>
      {/* Warm Point Light Casting from Gate */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 1.6]}
        color={PALETTE.gold}
        intensity={2.8}
        distance={6}
      />

      {/* Wall Torches */}
      <mesh position={[-1.0, 1.3, 1.25]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[-1.0, 1.5, 1.28]}>
        <boxGeometry args={[0.12, 0.15, 0.12]} />
        <meshLambertMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={1.2}
          flatShading
        />
      </mesh>

      <mesh position={[1.0, 1.3, 1.25]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[1.0, 1.5, 1.28]}>
        <boxGeometry args={[0.12, 0.15, 0.12]} />
        <meshLambertMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={1.2}
          flatShading
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 6. QUEST BOARD WITH SLIDING CARDS & GOLD BURST POP
// ============================================================================
export function QuestBoard() {
  const cardsMeshRef = useRef();
  const burstMeshRef = useRef();

  // 3 sliding sprint cards cycling: To-Do -> In Progress -> Done -> Pop!
  const cardStates = useMemo(() => {
    return [
      { id: 0, progress: 0.1, color: PALETTE.sky },
      { id: 1, progress: 0.45, color: PALETTE.parchment },
      { id: 2, progress: 0.8, color: PALETTE.gold },
    ];
  }, []);

  // Gold voxel burst particles when a card hits Done
  const burstParticles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 0.6 + (i % 3) * 0.3;
      list.push({
        vx: Math.cos(angle) * speed,
        vy: 0.8 + (i % 4) * 0.4,
        vz: Math.sin(angle) * speed * 0.5,
        color: i % 2 === 0 ? PALETTE.gold : PALETTE.sky,
      });
    }
    return list;
  }, []);

  const [burstActiveTime, setBurstActiveTime] = useState(-10);

  useEffect(() => {
    if (!cardsMeshRef.current) return;
    cardStates.forEach((c, i) => {
      _color.set(c.color);
      cardsMeshRef.current.setColorAt(i, _color);
    });
    if (cardsMeshRef.current.instanceColor) {
      cardsMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [cardStates]);

  useEffect(() => {
    if (!burstMeshRef.current) return;
    burstParticles.forEach((p, i) => {
      _color.set(p.color);
      burstMeshRef.current.setColorAt(i, _color);
    });
    if (burstMeshRef.current.instanceColor) {
      burstMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [burstParticles]);

  // Board columns X coordinates:
  // Col 1 (To-Do): -0.75
  // Col 2 (In Progress): 0.0
  // Col 3 (Done): +0.75
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycleDuration = 4.0; // 4s full loop
    const boardCenter = { x: -1.8, y: 1.0, z: 0.8 };

    // Update 3 cards
    if (cardsMeshRef.current) {
      cardStates.forEach((card, idx) => {
        // Offset each card so they follow in succession
        const rawTime = (t * 0.45 + idx * 0.333) % 1.0;
        let colX = -0.75 + rawTime * 1.5; // Slide from -0.75 to +0.75
        let scale = 1.0;

        // When card reaches Done (rawTime near 0.95), it shrinks / pops
        if (rawTime > 0.92) {
          scale = Math.max(0, 1.0 - (rawTime - 0.92) * 12);
          // Trigger particle burst at done location
          if (rawTime > 0.93 && t - burstActiveTime > 1.2) {
            setBurstActiveTime(t);
          }
        }

        _dummy.position.set(
          boardCenter.x + colX,
          boardCenter.y - 0.05 + Math.sin(t * 3 + idx) * 0.02,
          boardCenter.z + 0.12
        );
        _dummy.scale.set(0.42 * scale, 0.28 * scale, 0.06);
        _dummy.updateMatrix();
        cardsMeshRef.current.setMatrixAt(idx, _dummy.matrix);
      });
      cardsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update gold burst particles
    if (burstMeshRef.current) {
      const burstAge = t - burstActiveTime;
      const isBursting = burstAge >= 0 && burstAge < 0.8;

      burstParticles.forEach((p, i) => {
        if (isBursting) {
          const px = boardCenter.x + 0.75 + p.vx * burstAge;
          const py = boardCenter.y + p.vy * burstAge - 0.5 * 3.8 * burstAge * burstAge;
          const pz = boardCenter.z + 0.14 + p.vz * burstAge;
          const pScale = Math.max(0.01, (1.0 - burstAge / 0.8) * 0.12);

          _dummy.position.set(px, py, pz);
          _dummy.scale.set(pScale, pScale, pScale);
        } else {
          _dummy.position.set(0, -99, 0);
          _dummy.scale.set(0.001, 0.001, 0.001);
        }
        _dummy.updateMatrix();
        burstMeshRef.current.setMatrixAt(i, _dummy.matrix);
      });
      burstMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[-1.8, 0, 0.8]} rotation={[0, 0.2, 0]}>
      {/* Wooden Frame Support Posts */}
      <mesh position={[-1.15, 0.8, 0]}>
        <boxGeometry args={[0.18, 1.6, 0.18]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[1.15, 0.8, 0]}>
        <boxGeometry args={[0.18, 1.6, 0.18]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Board Backing Panel */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.3, 1.1, 0.12]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Board Header Voxel Bar */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[2.4, 0.22, 0.16]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>
      {/* Gold Sign Accent */}
      <mesh position={[0, 1.6, 0.09]}>
        <boxGeometry args={[0.8, 0.12, 0.02]} />
        <meshLambertMaterial color={PALETTE.gold} flatShading />
      </mesh>

      {/* Column Dividers */}
      <mesh position={[-0.38, 1.0, 0.06]}>
        <boxGeometry args={[0.04, 0.9, 0.04]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[0.38, 1.0, 0.06]}>
        <boxGeometry args={[0.04, 0.9, 0.04]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Column Header Tabs */}
      {/* To-Do */}
      <mesh position={[-0.75, 1.4, 0.07]}>
        <boxGeometry args={[0.45, 0.08, 0.02]} />
        <meshLambertMaterial color={PALETTE.sky} flatShading />
      </mesh>
      {/* Doing */}
      <mesh position={[0, 1.4, 0.07]}>
        <boxGeometry args={[0.45, 0.08, 0.02]} />
        <meshLambertMaterial color={PALETTE.parchment} flatShading />
      </mesh>
      {/* Done */}
      <mesh position={[0.75, 1.4, 0.07]}>
        <boxGeometry args={[0.45, 0.08, 0.02]} />
        <meshLambertMaterial color={PALETTE.gold} flatShading />
      </mesh>

      {/* Instanced sliding cards */}
      <instancedMesh
        ref={cardsMeshRef}
        args={[voxelBoxGeo, null, 3]}
        frustumCulled={false}
      >
        <meshLambertMaterial flatShading />
      </instancedMesh>

      {/* Instanced burst particles */}
      <instancedMesh
        ref={burstMeshRef}
        args={[voxelBoxGeo, null, 18]}
        frustumCulled={false}
      >
        <meshLambertMaterial
          flatShading
          emissive={PALETTE.gold}
          emissiveIntensity={0.8}
        />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// 7. SECRETS VAULT (Treasure Chest with Animated Lid & Gold Keyhole)
// ============================================================================
export function VaultChest({ onHoverChange }) {
  const [hovered, setHovered] = useState(false);
  const lidRef = useRef();
  const secretGemRef = useRef();

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    if (onHoverChange) onHoverChange(true);
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    if (onHoverChange) onHoverChange(false);
  };

  useFrame((_, delta) => {
    if (!lidRef.current) return;
    // Smooth stepped-feeling interpolation for the chest lid opening
    const targetRot = hovered ? -Math.PI * 0.42 : 0;
    lidRef.current.rotation.x = THREE.MathUtils.damp(
      lidRef.current.rotation.x,
      targetRot,
      12,
      delta
    );

    // Inside secret key/gem rotates and glows when open
    if (secretGemRef.current && hovered) {
      secretGemRef.current.rotation.y += delta * 3;
    }
  });

  return (
    <group
      position={[1.8, 0, 1.2]}
      rotation={[0, -0.35, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      cursor="pointer"
    >
      {/* Chest Base Body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Chest Corner Metal Bands (Ink / Edge) */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.24, 0.58, 0.82]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.16, 0.62, 0.76]} />
        <meshLambertMaterial color={PALETTE.panel} flatShading />
      </mesh>

      {/* Gold Keyhole Face plate */}
      <mesh position={[0, 0.38, 0.42]}>
        <boxGeometry args={[0.24, 0.24, 0.04]} />
        <meshLambertMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={hovered ? 0.9 : 0.3}
          flatShading
        />
      </mesh>
      {/* Keyhole slot */}
      <mesh position={[0, 0.37, 0.45]}>
        <boxGeometry args={[0.06, 0.12, 0.02]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Chest Interior Cavity (Visible when open) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.54]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>

      {/* Glowing Encrypted Secret Token / Key inside */}
      <group ref={secretGemRef} position={[0, 0.42, 0]}>
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshLambertMaterial
            color={PALETTE.gold}
            emissive={PALETTE.gold}
            emissiveIntensity={1.5}
            flatShading
          />
        </mesh>
      </group>

      {/* Articulated Lid (Hinged at back edge [0, 0.6, -0.4]) */}
      <group ref={lidRef} position={[0, 0.6, -0.4]}>
        <group position={[0, 0, 0.4]}>
          {/* Lid Arched / Stepped Box */}
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[1.24, 0.28, 0.84]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          {/* Gold Trim Band on Lid */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[1.26, 0.08, 0.3]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>
          {/* Lid Clasp */}
          <mesh position={[0, 0.06, 0.43]}>
            <boxGeometry args={[0.18, 0.14, 0.04]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>
        </group>
      </group>

      {/* Interactive Hitbox proxy */}
      <mesh position={[0, 0.5, 0]} visible={false}>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

// ============================================================================
// 8. VOXEL MAGE MASCOT (Gentle Bobbing, Wizard Staff)
// ============================================================================
export function VoxelMascot() {
  const mageRef = useRef();
  const staffCrystalRef = useRef();

  useFrame(({ clock }) => {
    if (!mageRef.current) return;
    const t = clock.getElapsedTime();
    // 16-bit stepped bobbing idle
    const stepBob = Math.floor(Math.sin(t * 3.5) * 4) * 0.025;
    mageRef.current.position.y = 0.5 + stepBob;

    // Staff crystal pulse
    if (staffCrystalRef.current) {
      staffCrystalRef.current.rotation.y = t * 2;
    }
  });

  return (
    <group ref={mageRef} position={[-0.4, 0.5, 2.2]} rotation={[0, 0.35, 0]}>
      {/* Mage Body / Robe */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.55, 0.76, 0.45]} />
        <meshLambertMaterial color={PALETTE.plum} flatShading />
      </mesh>

      {/* Robe Gold Trim hem */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.58, 0.12, 0.48]} />
        <meshLambertMaterial color={PALETTE.gold} flatShading />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.42, 0.38, 0.38]} />
        <meshLambertMaterial color={PALETTE.parchment} flatShading />
      </mesh>

      {/* Mage Eyes (Ink) */}
      <mesh position={[-0.1, 0.9, 0.2]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>
      <mesh position={[0.1, 0.9, 0.2]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshLambertMaterial color={PALETTE.ink} flatShading />
      </mesh>

      {/* Wizard Hat Base Brim */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.74, 0.1, 0.74]} />
        <meshLambertMaterial color={PALETTE.plum} flatShading />
      </mesh>

      {/* Hat Gold Band */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.52, 0.1, 0.52]} />
        <meshLambertMaterial color={PALETTE.gold} flatShading />
      </mesh>

      {/* Hat Cone Steps */}
      <mesh position={[0, 1.34, -0.04]}>
        <boxGeometry args={[0.42, 0.22, 0.42]} />
        <meshLambertMaterial color={PALETTE.plum} flatShading />
      </mesh>
      <mesh position={[0, 1.54, -0.1]}>
        <boxGeometry args={[0.28, 0.2, 0.28]} />
        <meshLambertMaterial color={PALETTE.plum} flatShading />
      </mesh>
      <mesh position={[0, 1.72, -0.18]}>
        <boxGeometry args={[0.14, 0.18, 0.14]} />
        <meshLambertMaterial color={PALETTE.gold} flatShading />
      </mesh>

      {/* Mage Left Arm holding staff */}
      <mesh position={[-0.34, 0.44, 0.1]}>
        <boxGeometry args={[0.16, 0.44, 0.16]} />
        <meshLambertMaterial color={PALETTE.plum} flatShading />
      </mesh>

      {/* Wooden Staff */}
      <mesh position={[-0.42, 0.6, 0.28]}>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        <meshLambertMaterial color={PALETTE.edge} flatShading />
      </mesh>

      {/* Glowing Staff Crystal */}
      <group ref={staffCrystalRef} position={[-0.42, 1.35, 0.28]}>
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshLambertMaterial
            color={PALETTE.gold}
            emissive={PALETTE.gold}
            emissiveIntensity={1.4}
            flatShading
          />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 9. PROCEDURAL VOXEL CHARACTER SILHOUETTES (Deliverable 3 & Class Showcase)
// Types: "knight" | "mage" | "rogue" | "ranger"
// ============================================================================
export function VoxelCharacter({ type = 'mage', selected = false, spin = true }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (spin) {
      // 16-frame discrete rotation or smooth retro spin
      groupRef.current.rotation.y += delta * 1.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.65, 0]}>
      {/* Highlight Ring in Gold when Selected */}
      {selected && (
        <group position={[0, 0.04, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.75, 0.9, 16]} />
            <meshLambertMaterial
              color={PALETTE.gold}
              emissive={PALETTE.gold}
              emissiveIntensity={1.2}
              flatShading
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Base shadow disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 12]} />
        <meshLambertMaterial color={PALETTE.edge} opacity={0.65} transparent />
      </mesh>

      {/* TYPE: KNIGHT */}
      {type === 'knight' && (
        <group position={[0, 0, 0]}>
          {/* Armored Legs */}
          <mesh position={[-0.14, 0.3, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.2]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          <mesh position={[0.14, 0.3, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.2]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>

          {/* Armored Torso / Breastplate */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.54, 0.55, 0.36]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          {/* Gold Chest Emblem */}
          <mesh position={[0, 0.85, 0.19]}>
            <boxGeometry args={[0.2, 0.2, 0.04]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>

          {/* Blood Red Cape */}
          <mesh position={[0, 0.72, -0.2]}>
            <boxGeometry args={[0.48, 0.7, 0.08]} />
            <meshLambertMaterial color={PALETTE.blood} flatShading />
          </mesh>

          {/* Knight Helm / Visor */}
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.44, 0.4, 0.4]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          {/* Helm Visor Slit */}
          <mesh position={[0, 1.24, 0.21]}>
            <boxGeometry args={[0.28, 0.08, 0.04]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>
          {/* Blood Red Crest / Plume */}
          <mesh position={[0, 1.54, -0.05]}>
            <boxGeometry args={[0.12, 0.22, 0.36]} />
            <meshLambertMaterial color={PALETTE.blood} flatShading />
          </mesh>

          {/* Left Arm & Shield */}
          <mesh position={[-0.34, 0.8, 0]}>
            <boxGeometry args={[0.16, 0.44, 0.16]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          <group position={[-0.45, 0.75, 0.12]}>
            <mesh>
              <boxGeometry args={[0.1, 0.6, 0.44]} />
              <meshLambertMaterial color={PALETTE.night} flatShading />
            </mesh>
            <mesh position={[-0.04, 0, 0]}>
              <boxGeometry args={[0.04, 0.4, 0.28]} />
              <meshLambertMaterial color={PALETTE.gold} flatShading />
            </mesh>
          </group>

          {/* Right Arm & Sword */}
          <mesh position={[0.34, 0.8, 0]}>
            <boxGeometry args={[0.16, 0.44, 0.16]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          <group position={[0.42, 0.9, 0.15]}>
            {/* Sword Blade */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.06, 0.7, 0.1]} />
              <meshLambertMaterial color={PALETTE.parchment} flatShading />
            </mesh>
            {/* Crossguard */}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.1, 0.06, 0.26]} />
              <meshLambertMaterial color={PALETTE.gold} flatShading />
            </mesh>
            {/* Hilt */}
            <mesh position={[0, -0.22, 0]}>
              <boxGeometry args={[0.06, 0.18, 0.06]} />
              <meshLambertMaterial color={PALETTE.edge} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* TYPE: MAGE */}
      {type === 'mage' && (
        <group position={[0, 0, 0]}>
          {/* Robe Body */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.54, 0.85, 0.44]} />
            <meshLambertMaterial color={PALETTE.plum} flatShading />
          </mesh>
          {/* Gold Hem */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.58, 0.12, 0.48]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>

          {/* Face */}
          <mesh position={[0, 1.08, 0]}>
            <boxGeometry args={[0.4, 0.35, 0.35]} />
            <meshLambertMaterial color={PALETTE.parchment} flatShading />
          </mesh>
          <mesh position={[-0.1, 1.08, 0.18]}>
            <boxGeometry args={[0.06, 0.06, 0.04]} />
            <meshLambertMaterial color={PALETTE.ink} flatShading />
          </mesh>
          <mesh position={[0.1, 1.08, 0.18]}>
            <boxGeometry args={[0.06, 0.06, 0.04]} />
            <meshLambertMaterial color={PALETTE.ink} flatShading />
          </mesh>

          {/* Wizard Hat */}
          <mesh position={[0, 1.28, 0]}>
            <boxGeometry args={[0.74, 0.08, 0.74]} />
            <meshLambertMaterial color={PALETTE.plum} flatShading />
          </mesh>
          <mesh position={[0, 1.38, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>
          <mesh position={[0, 1.52, -0.04]}>
            <boxGeometry args={[0.38, 0.22, 0.38]} />
            <meshLambertMaterial color={PALETTE.plum} flatShading />
          </mesh>
          <mesh position={[0, 1.7, -0.1]}>
            <boxGeometry args={[0.24, 0.2, 0.24]} />
            <meshLambertMaterial color={PALETTE.plum} flatShading />
          </mesh>
          <mesh position={[0, 1.86, -0.16]}>
            <boxGeometry args={[0.12, 0.14, 0.12]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>

          {/* Staff */}
          <group position={[0.38, 0.7, 0.15]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.07, 1.4, 0.07]} />
              <meshLambertMaterial color={PALETTE.edge} flatShading />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshLambertMaterial
                color={PALETTE.gold}
                emissive={PALETTE.gold}
                emissiveIntensity={1.4}
                flatShading
              />
            </mesh>
          </group>
        </group>
      )}

      {/* TYPE: ROGUE */}
      {type === 'rogue' && (
        <group position={[0, 0, 0]}>
          {/* Dark Trousers */}
          <mesh position={[-0.13, 0.3, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>
          <mesh position={[0.13, 0.3, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>

          {/* Leather Doublet */}
          <mesh position={[0, 0.76, 0]}>
            <boxGeometry args={[0.48, 0.52, 0.32]} />
            <meshLambertMaterial color={PALETTE.ink} flatShading />
          </mesh>
          {/* Dual Belts / Buckles */}
          <mesh position={[0, 0.65, 0.17]}>
            <boxGeometry args={[0.4, 0.08, 0.04]} />
            <meshLambertMaterial color={PALETTE.gold} flatShading />
          </mesh>

          {/* Hooded Cowl & Mask */}
          <mesh position={[0, 1.18, 0]}>
            <boxGeometry args={[0.44, 0.44, 0.42]} />
            <meshLambertMaterial color={PALETTE.night} flatShading />
          </mesh>
          {/* Exposed Eyes */}
          <mesh position={[0, 1.18, 0.2]}>
            <boxGeometry args={[0.28, 0.1, 0.06]} />
            <meshLambertMaterial color={PALETTE.parchment} flatShading />
          </mesh>
          <mesh position={[-0.08, 1.18, 0.24]}>
            <boxGeometry args={[0.05, 0.05, 0.02]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>
          <mesh position={[0.08, 1.18, 0.24]}>
            <boxGeometry args={[0.05, 0.05, 0.02]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>
          {/* Face Mask band */}
          <mesh position={[0, 1.05, 0.22]}>
            <boxGeometry args={[0.32, 0.14, 0.06]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>

          {/* Dual Daggers */}
          <group position={[-0.32, 0.7, 0.12]} rotation={[0.4, 0, 0]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.04, 0.34, 0.08]} />
              <meshLambertMaterial color={PALETTE.parchment} flatShading />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.06, 0.06, 0.12]} />
              <meshLambertMaterial color={PALETTE.blood} flatShading />
            </mesh>
          </group>

          <group position={[0.32, 0.7, 0.12]} rotation={[0.4, 0, 0]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.04, 0.34, 0.08]} />
              <meshLambertMaterial color={PALETTE.parchment} flatShading />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.06, 0.06, 0.12]} />
              <meshLambertMaterial color={PALETTE.blood} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* TYPE: RANGER */}
      {type === 'ranger' && (
        <group position={[0, 0, 0]}>
          {/* Boots & Trousers */}
          <mesh position={[-0.13, 0.3, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>
          <mesh position={[0.13, 0.3, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshLambertMaterial color={PALETTE.panel} flatShading />
          </mesh>

          {/* Forest Green Tunic */}
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.5, 0.54, 0.34]} />
            <meshLambertMaterial color={PALETTE.grass} flatShading />
          </mesh>
          {/* Leather Quiver Cross-strap */}
          <mesh position={[0, 0.8, 0.18]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.5, 0.08, 0.03]} />
            <meshLambertMaterial color={PALETTE.edge} flatShading />
          </mesh>

          {/* Quiver on Back */}
          <group position={[0.1, 0.85, -0.22]} rotation={[0, 0, -0.2]}>
            <mesh>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshLambertMaterial color={PALETTE.night} flatShading />
            </mesh>
            {/* Arrow Fletchings */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.1, 0.15, 0.1]} />
              <meshLambertMaterial color={PALETTE.gold} flatShading />
            </mesh>
          </group>

          {/* Face & Head */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.38, 0.36, 0.36]} />
            <meshLambertMaterial color={PALETTE.parchment} flatShading />
          </mesh>
          <mesh position={[-0.09, 1.2, 0.19]}>
            <boxGeometry args={[0.06, 0.06, 0.03]} />
            <meshLambertMaterial color={PALETTE.ink} flatShading />
          </mesh>
          <mesh position={[0.09, 1.2, 0.19]}>
            <boxGeometry args={[0.06, 0.06, 0.03]} />
            <meshLambertMaterial color={PALETTE.ink} flatShading />
          </mesh>

          {/* Robin Hood Feathered Cap */}
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[0.46, 0.12, 0.46]} />
            <meshLambertMaterial color={PALETTE.grass} flatShading />
          </mesh>
          <mesh position={[0, 1.48, -0.06]}>
            <boxGeometry args={[0.32, 0.12, 0.32]} />
            <meshLambertMaterial color={PALETTE.grass} flatShading />
          </mesh>
          {/* Red/Gold Feather */}
          <mesh position={[0.18, 1.54, -0.02]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.06, 0.22, 0.06]} />
            <meshLambertMaterial color={PALETTE.blood} flatShading />
          </mesh>

          {/* Voxel Longbow */}
          <group position={[-0.34, 0.75, 0.18]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshLambertMaterial color={PALETTE.edge} flatShading />
            </mesh>
            <mesh position={[0, 0.42, -0.06]}>
              <boxGeometry args={[0.05, 0.12, 0.1]} />
              <meshLambertMaterial color={PALETTE.edge} flatShading />
            </mesh>
            <mesh position={[0, -0.42, -0.06]}>
              <boxGeometry args={[0.05, 0.12, 0.1]} />
              <meshLambertMaterial color={PALETTE.edge} flatShading />
            </mesh>
            {/* Bowstring */}
            <mesh position={[0, 0, -0.1]}>
              <boxGeometry args={[0.02, 0.88, 0.02]} />
              <meshLambertMaterial color={PALETTE.parchment} flatShading />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
