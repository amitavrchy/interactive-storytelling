"use client";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
type Scene = { scene: string; scrollProgress: number; paused?: boolean };
class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function FogSea({ scene, scrollProgress }: Scene) {
  const points = useRef<THREE.Points>(null);
  const sea = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const storm = scene === "storm";
  const positions = useMemo(() => {
    const data = new Float32Array(180 * 3);
    for (let i = 0; i < data.length; i++)
      data[i] = Math.sin(i * 127.1 + 311.7) * (i % 3 === 1 ? 5 : 12);
    return data;
  }, []);
  useFrame(({ camera }, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    camera.position.z = 8 - scrollProgress * 0.3;
    if (points.current) {
      points.current.rotation.y = t * 0.012 + scrollProgress * 0.35;
      points.current.position.y = Math.sin(t * 0.15) * 0.2;
    }
    if (sea.current) {
      const geometry = sea.current.geometry;
      const attr = geometry.attributes.position;
      for (let i = 0; i < attr.count; i++)
        attr.setZ(
          i,
          Math.sin(attr.getX(i) * 1.3 + t * (storm ? 1.4 : 0.5)) *
            (storm ? 0.2 : 0.06) +
            Math.cos(attr.getY(i) * 0.9 + t * 0.4) * 0.07,
        );
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={storm ? 0.035 : 0.055}
          color={
            scene === "dawn" || scene === "harbour" ? "#f2c14e" : "#b6c8d5"
          }
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </points>
      <mesh ref={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -3]}>
        <planeGeometry args={[35, 18, 45, 24]} />
        <meshBasicMaterial
          color={storm ? "#789baa" : "#466d86"}
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
export default function Atmosphere({
  scene,
  scrollProgress,
  paused = false,
}: Scene) {
  const [supported, setSupported] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    try {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl2");
      setSupported(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  if (!supported) return null;
  return (
    <div className="atmosphere" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          dpr={[1, 1.5]}
          frameloop={visible && !paused ? "always" : "never"}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
          camera={{ position: [0, 0, 8], fov: 50 }}
        >
          <FogSea scene={scene} scrollProgress={scrollProgress} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
