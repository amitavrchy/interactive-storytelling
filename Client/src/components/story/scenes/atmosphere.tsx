"use client";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
type Scene = { scene: string };
class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
function FogSea({ scene }: Scene) {
  const points = useRef<THREE.Points>(null); const sea = useRef<THREE.Mesh>(null);
  const storm = scene === "storm";
  const positions = useMemo(() => {
    const data = new Float32Array(180 * 3);
    for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 127.1 + 311.7) * (i % 3 === 1 ? 5 : 12);
    return data;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (points.current) { points.current.rotation.y = t * .012; points.current.position.y = Math.sin(t * .15) * .2; }
    if (sea.current) {
      const geometry = sea.current.geometry; const attr = geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) attr.setZ(i, Math.sin(attr.getX(i) * 1.3 + t * (storm ? 1.4 : .5)) * (storm ? .2 : .06) + Math.cos(attr.getY(i) * .9 + t * .4) * .07);
      attr.needsUpdate = true;
    }
  });
  return <><ambientLight intensity={.5} /><points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={storm ? .035 : .055} color={scene === "dawn" ? "#f2c14e" : "#b6c8d5"} transparent opacity={.3} depthWrite={false} /></points><mesh ref={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -3]}><planeGeometry args={[35, 18, 45, 24]} /><meshBasicMaterial color={storm ? "#789baa" : "#466d86"} transparent opacity={.12} wireframe /></mesh></>;
}
export default function Atmosphere({ scene }: Scene) {
  const [supported, setSupported] = useState(false); const [visible, setVisible] = useState(true);
  useEffect(() => {
    const test = document.createElement("canvas"); const gl = test.getContext("webgl2");
    setSupported(!!gl); gl?.getExtension("WEBGL_lose_context")?.loseContext();
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  if (!supported) return null;
  return <div className="atmosphere" aria-hidden="true"><SceneBoundary><Canvas dpr={[1, 1.5]} frameloop={visible ? "always" : "never"} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }} camera={{ position: [0, 0, 8], fov: 50 }}><FogSea scene={scene} /></Canvas></SceneBoundary></div>;
}
