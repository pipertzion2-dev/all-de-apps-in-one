"use client";

import { useEffect, useRef, useState } from "react";

interface BuildAnimationProps {
  mode: "digital" | "physical";
}

export function BuildAnimation({ mode }: BuildAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      setWebglSupported(false);
      setIsLoading(false);
      return;
    }

    let animationId: number;
    let renderer: any;
    const textMeshes: any[] = [];

    const initThree = async () => {
      try {
        const THREE = await import("three");
        const { FontLoader } = await import("three/examples/jsm/loaders/FontLoader.js");
        const { TextGeometry } = await import("three/examples/jsm/geometries/TextGeometry.js");

        const container = containerEl;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 15;
        camera.position.y = 2;

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(mode === "digital" ? 0x5ba8a0 : 0x6b2c4a, 1, 50);
        pointLight.position.set(-5, 5, 5);
        scene.add(pointLight);

        const buildWords = [
          { text: "Bring", x: -6, y: 4, z: -2 },
          { text: "Users", x: -3, y: 2, z: 0 },
          { text: "Into", x: 0, y: 0, z: 1 },
          { text: "Logical", x: 3, y: -2, z: 0 },
          { text: "Delivery", x: 6, y: -4, z: -2 },
        ];

        const digitalColors = [0x2d5a56, 0x5ba8a0, 0x7bbdb7, 0xa8d5d0, 0xe8f4f3];
        const physicalColors = [0x4a1c32, 0x6b2c4a, 0x8b4a6b, 0xd4a5c9, 0xf5e8ee];
        const colors = mode === "digital" ? digitalColors : physicalColors;

        const loader = new FontLoader();
        loader.load(
          "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
          (font: any) => {
            buildWords.forEach((word, index) => {
              const geometry = new TextGeometry(word.text, {
                font: font,
                size: 0.8,
                depth: 0.15,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5,
              });

              geometry.computeBoundingBox();
              geometry.center();

              const material = new THREE.MeshStandardMaterial({
                color: colors[index],
                metalness: 0.3,
                roughness: 0.4,
                emissive: colors[index],
                emissiveIntensity: 0.1,
              });

              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(word.x, word.y, word.z);
              mesh.userData = {
                originalY: word.y,
                phase: index * 0.5,
                rotationSpeed: 0.001 + index * 0.0005,
              };

              scene.add(mesh);
              textMeshes.push(mesh);
            });
            setIsLoading(false);
          },
          undefined,
          () => {
            setWebglSupported(false);
            setIsLoading(false);
          },
        );

        const clock = new THREE.Clock();

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          const elapsed = clock.getElapsedTime();

          textMeshes.forEach((mesh) => {
            const { originalY, phase, rotationSpeed } = mesh.userData;
            mesh.position.y = originalY + Math.sin(elapsed * 0.5 + phase) * 0.3;
            mesh.rotation.y += rotationSpeed;
            mesh.rotation.x = Math.sin(elapsed * 0.3 + phase) * 0.05;
          });

          renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
          const newWidth = containerEl.clientWidth;
          const newHeight = containerEl.clientHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        console.error("Three.js initialization error:", error);
        setWebglSupported(false);
        setIsLoading(false);
      }
    };

    initThree();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
      textMeshes.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      if (containerEl && renderer?.domElement && containerEl.contains(renderer.domElement)) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, [mode]);

  const digitalColors = ["#2D5A56", "#5BA8A0", "#7BBDB7", "#A8D5D0", "#E8F4F3"];
  const physicalColors = ["#4A1C32", "#6B2C4A", "#8B4A6B", "#D4A5C9", "#F5E8EE"];
  const colors = mode === "digital" ? digitalColors : physicalColors;

  if (!webglSupported) {
    return (
      <div
        className="w-full h-full min-h-[400px] flex items-center justify-center"
        data-testid="build-animation-fallback"
      >
        <div className="relative w-full h-full">
          {["Bring", "Users", "Into", "Logical", "Delivery"].map((word, index) => (
            <div
              key={word}
              className="absolute font-bold text-3xl md:text-4xl animate-pulse"
              style={{
                color: colors[index],
                top: `${15 + index * 18}%`,
                left: `${10 + index * 15}%`,
                transform: `rotate(${-5 + index * 3}deg)`,
                animationDelay: `${index * 0.2}s`,
              }}
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" data-testid="build-animation" />
    </div>
  );
}
