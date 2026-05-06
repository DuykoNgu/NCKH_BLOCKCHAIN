import { memo, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Shared Geometries to save memory
const sphereGeom = new THREE.SphereGeometry(1, 8, 8);
const spokeGeom = new THREE.CylinderGeometry(0.006, 0.006, 1, 4); // Unit height for scaling
const birdGeom = new THREE.ConeGeometry(0.05, 0.16, 3);
const wingGeom = new THREE.PlaneGeometry(0.1, 0.04);

// Shared Materials
const particleMat = new THREE.MeshStandardMaterial({
  color: "#888888",
  emissive: "#444444",
  emissiveIntensity: 0.5,
  metalness: 0.9,
  roughness: 0.1,
  transparent: true,
  opacity: 0.6,
});

const spokeMat = new THREE.MeshStandardMaterial({ 
  color: "#222", 
  metalness: 0.8, 
  roughness: 0.2, 
  transparent: true, 
  opacity: 0.35 
});

// Floating particles around the scene
function Particles({ count = 60 }) {
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
    <instancedMesh ref={mesh} args={[sphereGeom, particleMat, count]} />
  );
}

// Glowing orbit rings
function OrbitRing({ radius, speed, color, thickness = 0.008 }: { radius: number; speed: number; color: string; thickness?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  
  // Use a lower segment count for rings (64 instead of 100)
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, thickness, 8, 64), [radius, thickness]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = Math.sin(t * speed * 0.3) * 0.4 + 0.3;
    ref.current.rotation.y = t * speed;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
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
    // Reduced radial segments from 80 to 48 for performance
    return data.map((d, i) => (
      <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[d.r, d.w, 8, 48]} />
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

  const spokes = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const len = i % 2 === 0 ? 2.2 : 1.6;
      return (
        <mesh 
          key={`s-${i}`} 
          geometry={spokeGeom} 
          material={spokeMat}
          rotation={[Math.PI / 2, 0, angle]} 
          scale={[1, len * 2, 1]} 
        />
      );
    });
  }, []);

  const birds = useMemo(() => {
    const birdMat = new THREE.MeshStandardMaterial({ color: "#111", metalness: 0.85, roughness: 0.2 });
    const wingMat = new THREE.MeshStandardMaterial({ color: "#222", metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const r = 1.75;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      return (
        <group key={`b-${i}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, angle + Math.PI / 2]}>
          <mesh geometry={birdGeom} material={birdMat} />
          <mesh geometry={wingGeom} material={wingMat} position={[0.06, 0, 0]} rotation={[0, 0, 0.3]} />
          <mesh geometry={wingGeom} material={wingMat} position={[-0.06, 0, 0]} rotation={[0, 0, -0.3]} />
        </group>
      );
    });
  }, []);

  const centerStar = useMemo(() => {
    const starMat = new THREE.MeshStandardMaterial({ color: "#333", metalness: 0.9, roughness: 0.1, emissive: "#222", emissiveIntensity: 0.2 });
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      return (
        <mesh 
          key={`star-${i}`} 
          geometry={spokeGeom} 
          material={starMat}
          rotation={[Math.PI / 2, 0, angle]} 
          scale={[1, 0.35, 1]}
        />
      );
    });
  }, []);

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
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

        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
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

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.035, 12, 64]} />
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
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }} // Antialias off for performance
        style={{ background: 'transparent' }}
        dpr={[1, 1.2]} // Capped DPR at 1.2
      >
        <color attach="background" args={['transparent']} />
        <fog attach="fog" args={['#ffffff', 6, 14]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#e8e8e8" />
        <pointLight position={[0, 0, 4]} intensity={0.8} color="#ffffff" />

        <TrongDongDisc />
        <Particles count={40} />

        <OrbitRing radius={3.2} speed={0.15} color="#aaaaaa" thickness={0.005} />
        <OrbitRing radius={3.8} speed={-0.1} color="#999999" thickness={0.004} />
        <OrbitRing radius={4.3} speed={0.08} color="#bbbbbb" thickness={0.003} />
      </Canvas>
    </div>
  );
});
