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

/**
 * DebugBot 3D Owl — built entirely from Three.js primitives
 *
 * Anatomy:
 *  - Body: squat elliptical sphere
 *  - Head: slightly smaller sphere on top
 *  - Eyes: Two large concentric circles — dark disc rim + bright emissive pupil
 *  - Beak: small downward cone
 *  - Ears/tufts: two small upward cones on top of head
 *  - Wings: two flattened box shapes on sides
 *  - Feet: two small cylinders underneath
 *
 * The owl floats gently, tracks the mouse (in hero mode), and changes glow
 * color based on agent state via the same CSS .bot-glow system.
 */
export default function DebugBot({ mode, agentState, size }: DebugBotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation mutation refs
  const bobSpeed = useRef(1.2);
  const isShaking = useRef(false);
  const targetEyeX = useRef(0);
  const targetEyeY = useRef(0);

  // Material / light refs for immediate state updates
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cyanLightRef = useRef<THREE.PointLight | null>(null);

  const defaultSize = mode === "hero" ? 220 : mode === "terminal" ? 44 : 36;
  const actualSize = size ?? defaultSize;

  useEffect(() => {
    if (!canvasRef.current) return;

    // ── SCENE & RENDERER ─────────────────────────
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(actualSize, actualSize);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── CAMERA ───────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.3, 5);

    // ── MATERIALS ────────────────────────────────
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1e37,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15,
      roughness: 0.6,
      metalness: 0.2,
    });
    bodyMaterialRef.current = bodyMaterial;

    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x242842,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.1,
      roughness: 0.5,
      metalness: 0.15,
    });

    const eyeRimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d112a,
      roughness: 0.8,
      metalness: 0.0,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00bbff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
    });
    eyeMaterialRef.current = eyeMaterial;

    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });

    const earMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f334e,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.05,
      roughness: 0.7,
    });

    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x161a33,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.05,
      roughness: 0.7,
      metalness: 0.1,
    });

    const footMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
    });

    // ── BUILD OWL GROUP ──────────────────────────
    const owlGroup = new THREE.Group();
    scene.add(owlGroup);

    // Body — squat ellipsoid
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.scale.set(0.9, 1.0, 0.75);
    bodyMesh.position.y = -0.3;
    owlGroup.add(bodyMesh);

    // Head — slightly smaller sphere sitting on body
    const headGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, headMaterial);
    headMesh.position.y = 0.7;
    headMesh.scale.set(1, 0.9, 0.85);
    owlGroup.add(headMesh);

    // Eye sockets (dark discs)
    const eyeRimGeo = new THREE.CircleGeometry(0.28, 32);
    const leftEyeRim = new THREE.Mesh(eyeRimGeo, eyeRimMaterial);
    leftEyeRim.position.set(-0.28, 0.78, 0.58);
    owlGroup.add(leftEyeRim);

    const rightEyeRim = new THREE.Mesh(eyeRimGeo, eyeRimMaterial);
    rightEyeRim.position.set(0.28, 0.78, 0.58);
    owlGroup.add(rightEyeRim);

    // Eye pupils (bright emissive spheres) — grouped for mouse tracking
    const eyeGroup = new THREE.Group();
    owlGroup.add(eyeGroup);

    const pupilGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeo, eyeMaterial);
    leftPupil.position.set(-0.28, 0.78, 0.65);
    eyeGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, eyeMaterial);
    rightPupil.position.set(0.28, 0.78, 0.65);
    eyeGroup.add(rightPupil);

    // Beak — small downward cone
    const beakGeo = new THREE.ConeGeometry(0.08, 0.15, 8);
    const beakMesh = new THREE.Mesh(beakGeo, beakMaterial);
    beakMesh.rotation.x = Math.PI; // point downward
    beakMesh.position.set(0, 0.58, 0.62);
    owlGroup.add(beakMesh);

    // Ear tufts — two small upward cones
    const earGeo = new THREE.ConeGeometry(0.1, 0.3, 6);
    const leftEar = new THREE.Mesh(earGeo, earMaterial);
    leftEar.position.set(-0.38, 1.3, 0.05);
    leftEar.rotation.z = 0.2;
    owlGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMaterial);
    rightEar.position.set(0.38, 1.3, 0.05);
    rightEar.rotation.z = -0.2;
    owlGroup.add(rightEar);

    // Wings — flattened boxes
    const wingGeo = new THREE.BoxGeometry(0.15, 0.7, 0.4);
    const leftWing = new THREE.Mesh(wingGeo, wingMaterial);
    leftWing.position.set(-0.95, -0.1, 0);
    leftWing.rotation.z = 0.15;
    owlGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMaterial);
    rightWing.position.set(0.95, -0.1, 0);
    rightWing.rotation.z = -0.15;
    owlGroup.add(rightWing);

    // Feet — small cylinders
    const footGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8);
    const leftFoot = new THREE.Mesh(footGeo, footMaterial);
    leftFoot.position.set(-0.25, -1.3, 0.1);
    owlGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, footMaterial);
    rightFoot.position.set(0.25, -1.3, 0.1);
    owlGroup.add(rightFoot);

    // ── LIGHTS ───────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xffffff, 2.0);
    mainLight.position.set(2, 3, 3);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x0099ff, 0.8);
    rimLight.position.set(-2, 1, -1);
    scene.add(rimLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 0);
    cyanLight.position.set(0, 2, 2);
    scene.add(cyanLight);
    cyanLightRef.current = cyanLight;

    // ── ANIMATION LOOP ──────────────────────────
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Idle float
      owlGroup.position.y = Math.sin(t * bobSpeed.current) * 0.06;
      owlGroup.rotation.y = Math.sin(t * 0.5) * 0.06;

      // Gentle wing flap
      leftWing.rotation.z = 0.15 + Math.sin(t * 1.5) * 0.08;
      rightWing.rotation.z = -0.15 - Math.sin(t * 1.5) * 0.08;

      // Shaking (error state)
      if (isShaking.current) {
        owlGroup.position.x = Math.sin(t * 18) * 0.7;
      } else {
        owlGroup.position.x *= 0.9; // smooth return
      }

      // State-based eye pulsing
      if (agentState === "thinking" && eyeMaterialRef.current) {
        eyeMaterialRef.current.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.8;
      } else if (agentState === "critic" && eyeMaterialRef.current) {
        eyeMaterialRef.current.emissiveIntensity = 1.0 + Math.sin(t * 5) * 0.6;
      }

      // Mouse tracking (hero mode)
      if (mode === "hero") {
        eyeGroup.rotation.x = THREE.MathUtils.lerp(eyeGroup.rotation.x, targetEyeX.current, 0.06);
        eyeGroup.rotation.y = THREE.MathUtils.lerp(eyeGroup.rotation.y, targetEyeY.current, 0.06);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── MOUSE TRACKING ──────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      if (mode !== "hero") return;
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = (e.clientY / window.innerHeight) * 2 - 1;
      targetEyeY.current = Math.max(-0.12, Math.min(0.12, mx * 0.2));
      targetEyeX.current = Math.max(-0.12, Math.min(0.12, -my * 0.15));
    };

    if (mode === "hero") {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // ── CLEANUP ─────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId);
      if (mode === "hero") {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      // Dispose geometries
      [bodyGeo, headGeo, eyeRimGeo, pupilGeo, beakGeo, earGeo, wingGeo, footGeo].forEach(g => g.dispose());
      // Dispose materials
      [bodyMaterial, headMaterial, eyeRimMaterial, eyeMaterial, beakMaterial, earMaterial, wingMaterial, footMaterial].forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [actualSize, mode]);

  // ── STATE MANAGEMENT ────────────────────────
  useEffect(() => {
    if (!bodyMaterialRef.current || !eyeMaterialRef.current || !cyanLightRef.current) return;

    const body = bodyMaterialRef.current;
    const eye = eyeMaterialRef.current;
    const light = cyanLightRef.current;

    switch (agentState) {
      case "idle":
        body.emissive.setHex(0x00f0ff);
        body.emissiveIntensity = 0.15;
        eye.emissive.setHex(0x00f0ff);
        eye.emissiveIntensity = 1.2;
        light.intensity = 0;
        bobSpeed.current = 1.2;
        isShaking.current = false;
        break;
      case "thinking":
        body.emissive.setHex(0x00f0ff);
        body.emissiveIntensity = 0.3;
        eye.emissive.setHex(0x00f0ff);
        light.intensity = 1.5;
        bobSpeed.current = 2.2;
        isShaking.current = false;
        break;
      case "triage":
        body.emissive.setHex(0xffaa00);
        body.emissiveIntensity = 0.25;
        eye.emissive.setHex(0xffcc00);
        eye.emissiveIntensity = 1.5;
        light.intensity = 0;
        bobSpeed.current = 1.6;
        isShaking.current = false;
        break;
      case "db":
        body.emissive.setHex(0x00ff88);
        body.emissiveIntensity = 0.2;
        eye.emissive.setHex(0x00ff88);
        eye.emissiveIntensity = 1.4;
        light.intensity = 0;
        bobSpeed.current = 1.5;
        isShaking.current = false;
        break;
      case "infra":
        body.emissive.setHex(0xff6600);
        body.emissiveIntensity = 0.2;
        eye.emissive.setHex(0xff6600);
        eye.emissiveIntensity = 1.3;
        light.intensity = 0;
        bobSpeed.current = 1.5;
        isShaking.current = false;
        break;
      case "network":
        body.emissive.setHex(0x0088ff);
        body.emissiveIntensity = 0.25;
        eye.emissive.setHex(0x0099ff);
        eye.emissiveIntensity = 1.4;
        light.intensity = 0.8;
        bobSpeed.current = 1.6;
        isShaking.current = false;
        break;
      case "critic":
        body.emissive.setHex(0xcc00ff);
        body.emissiveIntensity = 0.3;
        eye.emissive.setHex(0xdd44ff);
        light.intensity = 0;
        bobSpeed.current = 3.0;
        isShaking.current = false;
        break;
      case "success":
        body.emissive.setHex(0x00ff88);
        body.emissiveIntensity = 0.5;
        eye.emissive.setHex(0x00ff88);
        eye.emissiveIntensity = 2.0;
        light.intensity = 2;
        bobSpeed.current = 1.8;
        isShaking.current = false;
        break;
      case "error":
        body.emissive.setHex(0xff0055);
        body.emissiveIntensity = 0.4;
        eye.emissive.setHex(0xff0000);
        eye.emissiveIntensity = 2.0;
        light.intensity = 0;
        bobSpeed.current = 1.2;
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
