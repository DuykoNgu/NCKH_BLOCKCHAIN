import { memo, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles around the scene
function Particles({ count = 80 }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
      ] as [number, number, number],
      speed: 0.2 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      scale: 0.01 + Math.random() * 0.03,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(t * p.speed + p.offset) * 0.5,
        p.position[1] + Math.cos(t * p.speed * 0.7 + p.offset) * 0.5,
        p.position[2] + Math.sin(t * p.speed * 0.3) * 0.3
      );
      dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 2 + p.offset) * 0.3));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#888888"
        emissive="#444444"
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// Glowing orbit rings
function OrbitRing({ radius, speed, color, thickness = 0.008 }: { radius: number; speed: number; color: string; thickness?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = Math.sin(t * speed * 0.3) * 0.4 + 0.3;
    ref.current.rotation.y = t * speed;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.95}
        roughness={0.05}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

function TrongDongDisc() {
  const groupRef = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Mouse tracking with lerp
    const px = (state.pointer.x * viewport.width) / 2;
    const py = (state.pointer.y * viewport.height) / 2;
    mouseTarget.current.x = THREE.MathUtils.lerp(mouseTarget.current.x, px * 0.05, 0.02);
    mouseTarget.current.y = THREE.MathUtils.lerp(mouseTarget.current.y, py * 0.05, 0.02);

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.12 + mouseTarget.current.x;
      groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.15 + mouseTarget.current.y;
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = -t * 0.1;
    }
  });

  // Concentric rings with varying thickness
  const rings = useMemo(() => {
    const data = [
      { r: 2.2, w: 0.025, o: 0.4 },
      { r: 1.9, w: 0.02, o: 0.5 },
      { r: 1.6, w: 0.015, o: 0.6 },
      { r: 1.3, w: 0.02, o: 0.7 },
      { r: 1.0, w: 0.015, o: 0.6 },
      { r: 0.7, w: 0.02, o: 0.8 },
      { r: 0.4, w: 0.015, o: 0.5 },
    ];
    return data.map((d, i) => (
      <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[d.r, d.w, 12, 80]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.15}
          transparent
          opacity={d.o}
        />
      </mesh>
    ));
  }, []);

  // Decorative spokes
  const spokes = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const len = i % 2 === 0 ? 2.2 : 1.6;
      return (
        <mesh key={`s-${i}`} rotation={[Math.PI / 2, 0, angle]}>
          <cylinderGeometry args={[0.006, 0.006, len * 2, 4]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} transparent opacity={0.35} />
        </mesh>
      );
    });
  }, []);

  // Birds around the drum
  const birds = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const r = 1.75;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      return (
        <group key={`b-${i}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, angle + Math.PI / 2]}>
          <mesh>
            <coneGeometry args={[0.05, 0.16, 3]} />
            <meshStandardMaterial color="#111" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Wing effect */}
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, 0.3]}>
            <planeGeometry args={[0.1, 0.04]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          <mesh position={[-0.06, 0, 0]} rotation={[0, 0, -0.3]}>
            <planeGeometry args={[0.1, 0.04]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      );
    });
  }, []);

  // Central star / sun pattern
  const centerStar = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      return (
        <mesh key={`star-${i}`} rotation={[Math.PI / 2, 0, angle]} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.003, 0.35, 3]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} emissive="#222" emissiveIntensity={0.2} />
        </mesh>
      );
    });
  }, []);

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={groupRef}>
        {/* Central glowing core */}
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#ddd"
            emissive="#999"
            emissiveIntensity={0.4}
            metalness={1}
            roughness={0}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Inner pulsing sphere */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#fff"
            emissive="#aaa"
            emissiveIntensity={0.8}
            transparent
            opacity={0.4}
          />
        </mesh>

        {centerStar}

        <group ref={innerRef}>
          {rings}
          {spokes}
          {birds}
        </group>

        {/* Outer glass-like ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.035, 20, 100]} />
          <meshStandardMaterial
            color="#ccc"
            metalness={1}
            roughness={0.05}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default memo(function Scene3D() {
  return (
    <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#ffffff', 6, 14]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#e8e8e8" />
        <pointLight position={[0, 0, 4]} intensity={0.8} color="#ffffff" />
        <pointLight position={[3, 3, 2]} intensity={0.3} color="#dddddd" />

        <TrongDongDisc />
        <Particles count={60} />

        {/* Orbit rings */}
        <OrbitRing radius={3.2} speed={0.15} color="#aaaaaa" thickness={0.005} />
        <OrbitRing radius={3.8} speed={-0.1} color="#999999" thickness={0.004} />
        <OrbitRing radius={4.3} speed={0.08} color="#bbbbbb" thickness={0.003} />
      </Canvas>
    </div>
  );
});
