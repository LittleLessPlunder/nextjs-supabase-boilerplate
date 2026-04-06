'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// ─── Wave plane — manipulates geometry vertices each frame ───────────────────

function WavePlane() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);
  const origPositions = useRef<Float32Array | null>(null);
  const clock = useRef(0);

  const args = useMemo(
    (): [number, number, number, number] => [18, 10, 80, 50],
    [],
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    if (!geo) return;

    // Capture original positions once
    if (!origPositions.current) {
      origPositions.current = new Float32Array(geo.attributes.position.array);
    }

    clock.current += delta * 0.4;
    const t = clock.current;
    const pos = geo.attributes.position;
    const orig = origPositions.current;

    for (let i = 0; i < pos.count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1];
      const z =
        Math.sin(ox * 0.6 + t) * 0.22 +
        Math.sin(oy * 0.8 + t * 1.3) * 0.18 +
        Math.sin((ox + oy) * 0.4 + t * 0.7) * 0.12;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 5, 0, 0]} position={[0, -0.8, 0]}>
      <planeGeometry args={args} />
      {/* side={2} = DoubleSide */}
      <meshStandardMaterial color="#3B3020" side={2} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ─── Floating ambient orb ─────────────────────────────────────────────────────

function FloatingOrb({
  position,
  color,
  scale,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
}) {
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.0} transparent opacity={0.18} />
      </mesh>
    </Float>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <color attach="background" args={['#1C1207']} />
      <ambientLight intensity={0.6} color="#F5C994" />
      <directionalLight position={[5, 8, 5]} intensity={1.4} color="#E8A070" />
      <directionalLight position={[-6, -2, -3]} intensity={0.4} color="#4A5240" />
      <pointLight position={[0, 4, 2]} intensity={0.8} color="#C25C3E" distance={12} />
      <WavePlane />
      <FloatingOrb position={[-5, 2, -3]} color="#C25C3E" scale={2.2} />
      <FloatingOrb position={[6, 1.5, -4]} color="#8B5A2B" scale={1.6} />
      <FloatingOrb position={[1, 3.5, -5]} color="#4A5240" scale={3.0} />
    </>
  );
}

// ─── Canvas export ───────────────────────────────────────────────────────────

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
    </Canvas>
  );
}
