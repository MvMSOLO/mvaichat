import { Suspense, useRef, useEffect, useState, Component, type ReactNode } from "react";

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, Sparkles, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * HeroScene — cinematic 3D scene for the landing hero.
 * - Floating chromatic distorted orb (Double-Tire inspired)
 * - Ambient sparkles + far stars
 * - Cursor-driven parallax camera
 * - Auto-degrades on mobile
 */

function CameraRig() {
  const { camera, mouse } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 6));
  useFrame(() => {
    target.current.x = mouse.x * 0.6;
    target.current.y = mouse.y * 0.4;
    camera.position.lerp(target.current, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Orb({ color, position, scale, speed }: { color: string; position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15 * speed;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={ref} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          distort={0.45}
          speed={1.5}
          roughness={0.05}
          metalness={0.85}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </Sphere>
    </Float>
  );
}

function MainOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.08;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.6, 8]} />
        <MeshDistortMaterial
          color="#7c3aed"
          distort={0.5}
          speed={1.8}
          roughness={0.0}
          metalness={1}
          emissive="#06b6d4"
          emissiveIntensity={0.35}
        />
      </mesh>
    </Float>
  );
}

interface Props {
  className?: string;
  intensity?: "high" | "low";
}

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function HeroScene({ className = "", intensity = "high" }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(window.innerWidth < 768);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setWebglOk(canUseWebGL());
  }, []);

  const Fallback = (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-cyan-400 to-fuchsia-500 blur-2xl opacity-60" />
    </div>
  );

  // Static fallback for reduced-motion or no WebGL
  if (reducedMotion || !webglOk) return Fallback;

  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  const sparkleCount = isMobile ? 20 : 60;
  const useHigh = intensity === "high" && !isMobile;

  return (
    <div className={className}>
      <WebGLErrorBoundary fallback={Fallback}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#06b6d4" />
          <directionalLight position={[-5, -3, 4]} intensity={1} color="#a855f7" />
          <pointLight position={[0, 0, 3]} intensity={2} color="#f472b6" />

          <CameraRig />
          <MainOrb />

          {useHigh && (
            <>
              <Orb color="#06b6d4" position={[-3, 1.5, -1]} scale={0.5} speed={1.2} />
              <Orb color="#f472b6" position={[3, -1, -2]} scale={0.4} speed={0.8} />
              <Orb color="#fb923c" position={[2.5, 2, -3]} scale={0.3} speed={1.5} />
            </>
          )}

          <Sparkles count={sparkleCount} scale={10} size={2} speed={0.3} color="#06b6d4" opacity={0.6} />
          {useHigh && <Stars radius={50} depth={20} count={500} factor={2} fade speed={0.5} />}
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
