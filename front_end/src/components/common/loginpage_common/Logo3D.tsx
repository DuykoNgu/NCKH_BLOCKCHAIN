import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import type { Mesh } from "three";
import * as THREE from "three";

function LogoModel() {
  const ref = useRef<Mesh>(null);
  const { scene } = useGLTF("/base.glb");
  const [rotation, setRotation] = useState([0, 0, 0]);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            (mat as THREE.MeshStandardMaterial).color.set(0x6366f1); // Indigo
          });
        } else {
          (mesh.material as THREE.MeshStandardMaterial).color.set(0x6366f1);
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    const handleMouseDown = () => {
      isDragging.current = true;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      setRotation(prev => [
        prev[0] + deltaY * 0.01,
        prev[1] + deltaX * 0.01,
        prev[2]
      ]);

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useFrame(() => {
    if (ref.current) {
      if (!isDragging.current) {
        setRotation(prev => [
          prev[0],
          prev[1] + 0.005,
          prev[2]
        ]);
      }
      ref.current.rotation.x = rotation[0];
      ref.current.rotation.y = rotation[1];
      ref.current.rotation.z = rotation[2];
    }
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.5}
      rotation={[0, 0, 0]}
    />
  );
}

export default function Logo3D() {
  return (
    <div className="w-[500px] h-[400px]">
      <Canvas style={{ display: "block", width: "100%", height: "100%" }} camera={{ position: [0, 0, 3], fov: 35 }}>
        <Suspense fallback={null}>
          <LogoModel />
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}