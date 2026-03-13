import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function TrongDongDisc() {
  const meshRef = useRef<THREE.Group>(null!);
  const ringsRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.08;
    }
  });

  const rings = useMemo(() => {
    const radii = [1.8, 1.5, 1.2, 0.9, 0.6];
    return radii.map((r, i) => (
      <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.015, 8, 64]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
    ));
  }, []);

  // Radial spokes
  const spokes = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * 0.9;
      const z = Math.sin(angle) * 0.9;
      return (
        <mesh key={`spoke-${i}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, angle]}>
          <cylinderGeometry args={[0.01, 0.01, 1.8, 4]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
        </mesh>
      );
    });
  }, []);

  // Bird-like shapes around the drum
  const birds = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const r = 1.35;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      return (
        <mesh key={`bird-${i}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, angle + Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.18, 3]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.7} roughness={0.3} />
        </mesh>
      );
    });
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Central glass sphere */}
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.5}
            chromaticAberration={0.2}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            color="#e0e0e0"
            transmission={0.95}
            roughness={0.05}
          />
        </mesh>

        {/* Concentric rings */}
        <group ref={ringsRef}>
          {rings}
          {spokes}
          {birds}
        </group>

        {/* Outer glass torus */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.0, 0.04, 16, 64]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.3}
            chromaticAberration={0.1}
            color="#f0f0f0"
            transmission={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, 4]} intensity={0.4} />
        <pointLight position={[0, 0, 3]} intensity={0.5} />
        <TrongDongDisc />
      </Canvas>
    </div>
  );
}
