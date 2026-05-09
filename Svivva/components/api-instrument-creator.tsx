"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

interface ApiInstrumentCreatorProps {
  onComplete: (data: {
    prompt: string;
    name: string;
    icon: string;
    palette: { primary: string; secondary: string; accent: string };
  }) => void;
}

interface TailoredQuestion {
  id: string;
  question: string;
  options: string[];
}

interface BrandSuggestion {
  names: string[];
  icons: string[];
  palettes: { name: string; colors: { primary: string; secondary: string; accent: string } }[];
}

export function ApiInstrumentCreator({ onComplete }: ApiInstrumentCreatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"prompt" | "questions" | "brand">("prompt");
  const [tailoredQuestions, setTailoredQuestions] = useState<TailoredQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<BrandSuggestion | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<{
    name: string;
    colors: { primary: string; secondary: string; accent: string };
  } | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);

  const buttonsRef = useRef<
    Map<string, { x: number; y: number; w: number; h: number; action: () => void }>
  >(new Map());

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const generateTailoredQuestions = useCallback(async (userPrompt: string) => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 400));

    const words = userPrompt.toLowerCase();
    const questions: TailoredQuestion[] = [];

    if (words.includes("analyz") || words.includes("review") || words.includes("sentiment")) {
      questions.push({
        id: "depth",
        question: "Analysis depth?",
        options: ["Light", "Medium", "Deep", "Full"],
      });
    } else if (words.includes("generat") || words.includes("creat") || words.includes("write")) {
      questions.push({
        id: "creativity",
        question: "Creativity level?",
        options: ["Low", "Medium", "High", "Max"],
      });
    } else {
      questions.push({
        id: "style",
        question: "Processing style?",
        options: ["Fast", "Balanced", "Deep", "Max"],
      });
    }

    questions.push({
      id: "output",
      question: "Output detail?",
      options: ["Brief", "Standard", "Detailed", "Full"],
    });
    questions.push({
      id: "tone",
      question: "Response tone?",
      options: ["Pro", "Friendly", "Tech", "Casual"],
    });

    setTailoredQuestions(questions);
    setPhase("questions");
    setIsGenerating(false);
  }, []);

  const generateBrandSuggestions = useCallback(async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 300));

    const words = prompt.split(" ");
    const keyword = words.find((w) => w.length > 3) || "API";
    const cap = keyword.charAt(0).toUpperCase() + keyword.slice(1, 6).toLowerCase();

    const mock: BrandSuggestion = {
      names: [`${cap}AI`, `${cap}Pro`, `Smart${cap}`],
      icons: ["Zap", "Target", "Sparkles", "Rocket", "Brain", "Cpu"],
      palettes: [
        { name: "Svivva", colors: { primary: "#5BA8A0", secondary: "#4a9890", accent: "#6B2C4A" } },
        { name: "Ocean", colors: { primary: "#0ea5e9", secondary: "#0284c7", accent: "#06b6d4" } },
        { name: "Violet", colors: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#a855f7" } },
      ],
    };

    setSuggestions(mock);
    setSelectedName(mock.names[0]);
    setSelectedIcon(mock.icons[0]);
    setSelectedPalette(mock.palettes[0]);
    setPhase("brand");
    setIsGenerating(false);
  }, [prompt]);

  const handleOptionSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      setTimeout(() => {
        if (currentQuestionIndex < tailoredQuestions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          void generateBrandSuggestions();
        }
      }, 150);
    },
    [currentQuestionIndex, tailoredQuestions.length, generateBrandSuggestions],
  );

  const drawScreen = useCallback(() => {
    const canvas = screenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = "#5BA8A0";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 796, 396);

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(91, 168, 160, ${0.015})`;
      ctx.fillRect(0, i * 13, 800, 1);
    }

    buttonsRef.current.clear();

    if (phase === "prompt") {
      ctx.fillStyle = "#5BA8A0";
      ctx.font = "bold 32px monospace";
      ctx.fillText("DEFINE YOUR API", 40, 60);

      ctx.fillStyle = "#666";
      ctx.font = "16px monospace";
      ctx.fillText("Click here and type your prompt, then press ENTER", 40, 95);

      ctx.fillStyle = "#0c0c18";
      ctx.fillRect(40, 120, 600, 60);
      ctx.strokeStyle = isFocused ? "#5BA8A0" : "#333";
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 120, 600, 60);

      ctx.fillStyle = prompt ? "#f0f0f5" : "#555";
      ctx.font = "22px monospace";
      const displayText = prompt || "e.g., Analyze customer sentiment...";
      const truncated = displayText.length > 38 ? displayText.slice(-38) : displayText;
      ctx.fillText(truncated, 55, 160);

      if (isFocused && cursorVisible) {
        const textWidth = ctx.measureText(prompt || "").width;
        ctx.fillStyle = "#5BA8A0";
        ctx.fillRect(55 + Math.min(textWidth, 560), 135, 3, 30);
      }

      const btnX = 660;
      const btnW = 100;
      const btnH = 60;
      const canGo = prompt.length >= 10;

      ctx.fillStyle = canGo ? "#5BA8A0" : "#222";
      ctx.fillRect(btnX, 120, btnW, btnH);
      ctx.fillStyle = canGo ? "#080810" : "#555";
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText(isGenerating ? "..." : "GO", btnX + btnW / 2, 160);
      ctx.textAlign = "left";

      buttonsRef.current.set("go", {
        x: btnX,
        y: 120,
        w: btnW,
        h: btnH,
        action: () => {
          if (prompt.length >= 10 && !isGenerating) generateTailoredQuestions(prompt);
        },
      });

      ctx.fillStyle = "#444";
      ctx.font = "14px monospace";
      ctx.fillText(`${prompt.length} characters${prompt.length < 10 ? " (min 10)" : ""}`, 40, 210);

      ctx.fillStyle = prompt.length >= 10 ? "#5BA8A0" : "#6B2C4A";
      ctx.beginPath();
      ctx.arc(45, 250, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#888";
      ctx.font = "16px monospace";
      ctx.fillText(prompt.length >= 10 ? "READY" : "WAITING FOR INPUT", 70, 256);
    }

    if (phase === "questions" && tailoredQuestions[currentQuestionIndex]) {
      const q = tailoredQuestions[currentQuestionIndex];

      ctx.fillStyle = "#5BA8A0";
      ctx.font = "bold 28px monospace";
      ctx.fillText(q.question, 40, 55);

      ctx.fillStyle = "#555";
      ctx.font = "14px monospace";
      ctx.fillText(`Question ${currentQuestionIndex + 1} of ${tailoredQuestions.length}`, 40, 85);

      const optW = 170;
      const optH = 70;
      const startX = 40;
      const startY = 110;

      q.options.forEach((opt, i) => {
        const x = startX + i * (optW + 15);
        const sel = answers[q.id] === opt;
        const hov = hoveredButton === `opt-${opt}`;

        ctx.fillStyle = sel ? "rgba(91,168,160,0.4)" : hov ? "rgba(91,168,160,0.2)" : "#0c0c18";
        ctx.fillRect(x, startY, optW, optH);
        ctx.strokeStyle = sel ? "#5BA8A0" : hov ? "#5BA8A0" : "#333";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, startY, optW, optH);

        ctx.fillStyle = sel ? "#5BA8A0" : hov ? "#7ac8c0" : "#999";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(opt, x + optW / 2, startY + 45);
        ctx.textAlign = "left";

        buttonsRef.current.set(`opt-${opt}`, {
          x,
          y: startY,
          w: optW,
          h: optH,
          action: () => handleOptionSelect(q.id, opt),
        });
      });

      const barY = 220;
      ctx.fillStyle = "#333";
      ctx.font = "12px monospace";
      ctx.fillText("PROGRESS", 40, barY);

      tailoredQuestions.forEach((_, i) => {
        const bx = 40 + i * 100;
        ctx.fillStyle =
          i < currentQuestionIndex
            ? "#5BA8A0"
            : i === currentQuestionIndex
              ? "rgba(91,168,160,0.5)"
              : "#1a1a28";
        ctx.fillRect(bx, barY + 10, 85, 20);
      });
    }

    if (phase === "brand" && suggestions) {
      ctx.fillStyle = "#5BA8A0";
      ctx.font = "bold 26px monospace";
      ctx.fillText("CHOOSE YOUR BRAND", 40, 45);

      ctx.fillStyle = "#555";
      ctx.font = "12px monospace";
      ctx.fillText("NAME", 40, 75);

      let x = 40;
      suggestions.names.forEach((n) => {
        const w = Math.max(ctx.measureText(n).width + 30, 80);
        const sel = selectedName === n;
        const hov = hoveredButton === `name-${n}`;

        ctx.fillStyle = sel ? "#5BA8A0" : hov ? "rgba(91,168,160,0.3)" : "#0c0c18";
        ctx.fillRect(x, 85, w, 40);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#333";
        ctx.strokeRect(x, 85, w, 40);
        ctx.fillStyle = sel ? "#080810" : "#999";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(n, x + w / 2, 112);
        ctx.textAlign = "left";

        buttonsRef.current.set(`name-${n}`, {
          x,
          y: 85,
          w,
          h: 40,
          action: () => setSelectedName(n),
        });
        x += w + 15;
      });

      ctx.fillStyle = "#555";
      ctx.font = "12px monospace";
      ctx.fillText("ICON", 40, 150);

      x = 40;
      const iconSymbols = ["Z", "T", "S", "R", "B", "C"];
      const iconNames = ["Zap", "Target", "Sparkles", "Rocket", "Brain", "Cpu"];
      iconSymbols.forEach((ic, i) => {
        const sel = selectedIcon === iconNames[i];
        const hov = hoveredButton === `icon-${iconNames[i]}`;

        ctx.fillStyle = sel ? "rgba(91,168,160,0.4)" : hov ? "rgba(91,168,160,0.2)" : "#0c0c18";
        ctx.fillRect(x, 160, 50, 50);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#333";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, 160, 50, 50);

        ctx.fillStyle = sel ? "#5BA8A0" : "#777";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ic, x + 25, 195);
        ctx.textAlign = "left";

        buttonsRef.current.set(`icon-${iconNames[i]}`, {
          x,
          y: 160,
          w: 50,
          h: 50,
          action: () => setSelectedIcon(iconNames[i]),
        });
        x += 60;
      });

      ctx.fillStyle = "#555";
      ctx.font = "12px monospace";
      ctx.fillText("COLOR PALETTE", 40, 240);

      x = 40;
      suggestions.palettes.forEach((p) => {
        const sel = selectedPalette?.name === p.name;
        const hov = hoveredButton === `pal-${p.name}`;

        ctx.fillStyle = sel ? "rgba(91,168,160,0.2)" : hov ? "rgba(91,168,160,0.1)" : "#0c0c18";
        ctx.fillRect(x, 250, 120, 80);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#333";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, 250, 120, 80);

        ctx.fillStyle = p.colors.primary;
        ctx.fillRect(x + 15, 265, 40, 35);
        ctx.fillStyle = p.colors.accent;
        ctx.fillRect(x + 65, 265, 40, 35);

        ctx.fillStyle = sel ? "#f0f0f5" : "#777";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.name, x + 60, 318);
        ctx.textAlign = "left";

        buttonsRef.current.set(`pal-${p.name}`, {
          x,
          y: 250,
          w: 120,
          h: 80,
          action: () => setSelectedPalette(p),
        });
        x += 135;
      });

      const btnX = 550;
      const canCreate = selectedName && selectedIcon && selectedPalette;
      ctx.fillStyle = canCreate ? "#5BA8A0" : "#222";
      ctx.fillRect(btnX, 270, 200, 60);
      ctx.fillStyle = canCreate ? "#080810" : "#555";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CREATE API", btnX + 100, 310);
      ctx.textAlign = "left";

      buttonsRef.current.set("create", {
        x: btnX,
        y: 270,
        w: 200,
        h: 60,
        action: () => {
          if (selectedName && selectedIcon && selectedPalette) {
            onComplete({
              prompt,
              name: selectedName,
              icon: selectedIcon,
              palette: selectedPalette.colors,
            });
          }
        },
      });
    }

    if (screenTextureRef.current) screenTextureRef.current.needsUpdate = true;
  }, [
    phase,
    prompt,
    isGenerating,
    tailoredQuestions,
    currentQuestionIndex,
    answers,
    suggestions,
    selectedName,
    selectedIcon,
    selectedPalette,
    hoveredButton,
    isFocused,
    cursorVisible,
    onComplete,
    generateTailoredQuestions,
    handleOptionSelect,
  ]);

  useEffect(() => {
    drawScreen();
  }, [drawScreen]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a10);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404050, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(2, 8, 6);
    scene.add(mainLight);

    const tealLight = new THREE.PointLight(0x5ba8a0, 0.5);
    tealLight.position.set(-6, 4, 6);
    scene.add(tealLight);

    const burgundyLight = new THREE.PointLight(0x6b2c4a, 0.3);
    burgundyLight.position.set(6, 3, -4);
    scene.add(burgundyLight);

    const group = new THREE.Group();

    const caseMat = new THREE.MeshStandardMaterial({
      color: 0xd8d4d0,
      metalness: 0.05,
      roughness: 0.85,
    });
    const caseGeom = new THREE.BoxGeometry(10, 0.5, 6);
    const caseMesh = new THREE.Mesh(caseGeom, caseMat);
    caseMesh.position.y = 0.25;
    group.add(caseMesh);

    const rearMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      metalness: 0.3,
      roughness: 0.6,
    });
    const rearPanel = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 0.3), rearMat);
    rearPanel.position.set(0, 1.5, -2.85);
    group.add(rearPanel);

    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 800;
    screenCanvas.height = 400;
    screenCanvasRef.current = screenCanvas;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTextureRef.current = screenTexture;

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), screenMat);
    screen.position.set(0, 2.2, -2.5);
    screen.rotation.x = -0.2;
    screenMeshRef.current = screen;
    group.add(screen);

    const screenFrameMat = new THREE.MeshStandardMaterial({
      color: 0x101018,
      metalness: 0.4,
      roughness: 0.5,
    });
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.4, 0.15), screenFrameMat);
    screenFrame.position.set(0, 2.2, -2.6);
    screenFrame.rotation.x = -0.2;
    group.add(screenFrame);

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x5ba8a0,
      emissive: 0x5ba8a0,
      emissiveIntensity: 0.4,
    });
    const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.2), accentMat);
    accentStrip.position.set(0, 0.56, 1.5);
    group.add(accentStrip);

    const padMat = new THREE.MeshStandardMaterial({
      color: 0x909098,
      metalness: 0.65,
      roughness: 0.3,
    });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), padMat);
        pad.position.set(-2.7 + col * 1.2, 0.56, 0.8 - row * 1.2);
        group.add(pad);
      }
    }

    const knobMat = new THREE.MeshStandardMaterial({
      color: 0x606068,
      metalness: 0.7,
      roughness: 0.25,
    });
    for (let i = 0; i < 4; i++) {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.3, 16), knobMat);
      knob.position.set(3 + i * 0.9, 0.65, 0.5);
      group.add(knob);
    }

    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x808088,
      metalness: 0.5,
      roughness: 0.35,
    });
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.5), buttonMat);
      btn.position.set(3.2 + i * 0.8, 0.58, -0.8);
      group.add(btn);
    }

    scene.add(group);
    drawScreen();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const getScreenUV = (clientX: number, clientY: number): { u: number; v: number } | null => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObject(screen);

      if (intersects.length > 0 && intersects[0].uv) {
        return { u: intersects[0].uv.x, v: intersects[0].uv.y };
      }
      return null;
    };

    const handleClick = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.changedTouches[0]?.clientX || 0 : e.clientX;
      const clientY = "touches" in e ? e.changedTouches[0]?.clientY || 0 : e.clientY;

      setIsFocused(true);
      hiddenInputRef.current?.focus();

      const uv = getScreenUV(clientX, clientY);
      if (uv) {
        const x = uv.u * 800;
        const y = (1 - uv.v) * 400;

        buttonsRef.current.forEach((btn) => {
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            btn.action();
          }
        });
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX || 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY || 0 : e.clientY;

      let found: string | null = null;

      const uv = getScreenUV(clientX, clientY);
      if (uv) {
        const x = uv.u * 800;
        const y = (1 - uv.v) * 400;

        buttonsRef.current.forEach((btn, key) => {
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            found = key;
          }
        });
      }

      setHoveredButton(found);
      container.style.cursor = found ? "pointer" : "default";
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("touchend", handleClick);
    container.addEventListener("mousemove", handleMove);
    container.addEventListener("touchmove", handleMove, { passive: true });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("touchend", handleClick);
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("touchmove", handleMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // Scene mounts once; screen canvas is updated via the [drawScreen] effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid rebuilding Three.js scene on every drawScreen identity change
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && prompt.length >= 10 && !isGenerating && phase === "prompt") {
        generateTailoredQuestions(prompt);
      }
    },
    [prompt, isGenerating, phase, generateTailoredQuestions],
  );

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[500px] sm:h-[550px]"
        style={{ background: "#0a0a10" }}
      />

      <input
        ref={hiddenInputRef}
        type="text"
        value={prompt}
        onChange={(e) => phase === "prompt" && setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute opacity-0 pointer-events-none"
        style={{ top: 0, left: 0 }}
        data-testid="input-prompt"
        autoFocus
      />

      <p className="text-center text-xs text-gray-500 mt-3">
        Click the screen to focus, then type your prompt
      </p>
    </div>
  );
}
