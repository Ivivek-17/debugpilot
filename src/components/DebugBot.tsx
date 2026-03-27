"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface DebugBotProps {
  mode: "hero" | "terminal" | "nav";
  agentState:
    | "idle"
    | "thinking"
    | "triage"
    | "db"
    | "infra"
    | "network"
    | "critic"
    | "success"
    | "error";
  size?: number;
}

export default function DebugBot({ mode, agentState, size }: DebugBotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable refs for animation state
  const bobSpeed = useRef(1.2);
  const isShaking = useRef(false);
  const targetEyeX = useRef(0);
  const targetEyeY = useRef(0);

  // Material and Light refs to update immediately on state change
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cyanLightRef = useRef<THREE.PointLight | null>(null);

  const defaultSize = mode === "hero" ? 220 : mode === "terminal" ? 44 : 36;
  const actualSize = size ?? defaultSize;

  useEffect(() => {
    if (!canvasRef.current) return;

    // SCENE & RENDERER
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(actualSize, actualSize);
    renderer.setPixelRatio(window.devicePixelRatio);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.5;
    if (mode === "hero") camera.position.y = 0.2; // Slight look down

    // MATERIALS
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc2200,
      emissive: 0xff3300,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.1,
    });
    bodyMaterialRef.current = bodyMaterial;

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00bbff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.9,
    });

    const limbMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa1100,
      roughness: 0.5,
    });

    // GEOMETRIES & MESHES
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // Body
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.scale.set(1, 0.9, 0.85);
    bodyGroup.add(bodyMesh);

    // Eyes
    const eyeGroup = new THREE.Group();
    bodyGroup.add(eyeGroup);

    const eyeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.32, 0.2, 0.82);
    eyeGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.32, 0.2, 0.82);
    eyeGroup.add(rightEye);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 12);
    
    const leftArm = new THREE.Mesh(armGeo, limbMaterial);
    leftArm.rotation.z = 1.4;
    leftArm.position.set(-1.1, 0, 0);
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, limbMaterial);
    rightArm.rotation.z = -1.4;
    rightArm.position.set(1.1, 0, 0);
    bodyGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 12);
    
    const leftLeg = new THREE.Mesh(legGeo, limbMaterial);
    leftLeg.position.set(-0.3, -0.95, 0);
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, limbMaterial);
    rightLeg.position.set(0.3, -0.95, 0);
    bodyGroup.add(rightLeg);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xffffff, 2.5);
    mainLight.position.set(2, 3, 3);
    scene.add(mainLight);

    const underGlowLight = new THREE.PointLight(0xff2200, 1.2);
    underGlowLight.position.set(0, -2, 1);
    scene.add(underGlowLight);

    const cyanLight = new THREE.PointLight(0x00d4ff, 0);
    cyanLight.position.set(0, 2, 2);
    scene.add(cyanLight);
    cyanLightRef.current = cyanLight;

    // ANIMATION LOOP
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Idle bobbing & rotation
      bodyGroup.position.y = Math.sin(t * bobSpeed.current) * 0.08;
      bodyGroup.rotation.y = Math.sin(t * 0.7) * 0.08;

      // Shaking
      if (isShaking.current) {
        bodyGroup.position.x = Math.sin(t * 15) * 0.15;
      } else {
        bodyGroup.position.x = 0;
      }

      // State-based dynamic pulsing
      if (agentState === "thinking" && bodyMaterialRef.current) {
        bodyMaterialRef.current.emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.6;
      } else if (agentState === "critic" && bodyMaterialRef.current) {
        bodyMaterialRef.current.emissiveIntensity = 0.4 + Math.sin(t * 5) * 0.5;
      }

      // Mouse tracking lerp (hero only)
      if (mode === "hero") {
        eyeGroup.rotation.x = THREE.MathUtils.lerp(eyeGroup.rotation.x, targetEyeX.current, 0.08);
        eyeGroup.rotation.y = THREE.MathUtils.lerp(eyeGroup.rotation.y, targetEyeY.current, 0.08);
      }

      renderer.render(scene, camera);
    };
    animate();

    // MOUSE TRACKING
    const handleMouseMove = (e: MouseEvent) => {
      if (mode !== "hero") return;
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      
      // Max rotation ~0.15 rad
      const clampX = Math.max(-0.15, Math.min(0.15, mouseX * 0.25));
      const clampY = Math.max(-0.15, Math.min(0.15, -mouseY * 0.2));
      
      targetEyeY.current = clampX;
      targetEyeX.current = clampY;
    };

    if (mode === "hero") {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      if (mode === "hero") {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      
      // Dispose Geometries and Materials
      bodyGeo.dispose();
      eyeGeo.dispose();
      armGeo.dispose();
      legGeo.dispose();
      
      bodyMaterial.dispose();
      eyeMaterial.dispose();
      limbMaterial.dispose();

      renderer.dispose();
    };
  }, [actualSize, mode]);

  // STATE MANAGEMENT
  useEffect(() => {
    if (!bodyMaterialRef.current || !cyanLightRef.current) return;

    const m = bodyMaterialRef.current;
    const l = cyanLightRef.current;

    switch (agentState) {
      case "idle":
        m.emissive.setHex(0xff3300);
        m.emissiveIntensity = 0.3;
        l.intensity = 0;
        bobSpeed.current = 1.2;
        isShaking.current = false;
        break;
      case "thinking":
        m.emissive.setHex(0xff3300);
        l.intensity = 1.5;
        bobSpeed.current = 2.5;
        isShaking.current = false;
        break;
      case "triage":
        m.emissive.setHex(0xffaa00);
        m.emissiveIntensity = 0.6;
        l.intensity = 0;
        bobSpeed.current = 1.8;
        isShaking.current = false;
        break;
      case "db":
        m.emissive.setHex(0x00ff88);
        m.emissiveIntensity = 0.5;
        l.intensity = 0;
        bobSpeed.current = 1.5;
        isShaking.current = false;
        break;
      case "infra":
        m.emissive.setHex(0xff6600);
        m.emissiveIntensity = 0.5;
        l.intensity = 0;
        bobSpeed.current = 1.5;
        isShaking.current = false;
        break;
      case "network":
        m.emissive.setHex(0x0088ff);
        m.emissiveIntensity = 0.6;
        l.intensity = 0.8;
        bobSpeed.current = 1.6;
        isShaking.current = false;
        break;
      case "critic":
        m.emissive.setHex(0xcc00ff);
        l.intensity = 0;
        bobSpeed.current = 3.5;
        isShaking.current = false;
        break;
      case "success":
        m.emissive.setHex(0x00ff88);
        m.emissiveIntensity = 1.2;
        l.intensity = 2;
        bobSpeed.current = 2.0;
        isShaking.current = false;
        break;
      case "error":
        m.emissive.setHex(0xff0000);
        m.emissiveIntensity = 1.0;
        l.intensity = 0;
        bobSpeed.current = 1.2; // keep bobbing normal
        isShaking.current = true;
        break;
    }
  }, [agentState]);

  return (
    <div className="bot-wrapper" style={{ width: actualSize, height: actualSize }}>
      <div className="bot-glow" data-state={agentState} />
      <canvas ref={canvasRef} />
    </div>
  );
}
