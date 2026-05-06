"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

interface ApiPanelCreatorProps {
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

export function ApiPanelCreator({ onComplete }: ApiPanelCreatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const panelMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
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
  const [selectedPalette, setSelectedPalette] = useState<{ name: string; colors: { primary: string; secondary: string; accent: string } } | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);

  const buttonsRef = useRef<Map<string, { x: number; y: number; w: number; h: number; action: () => void }>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const drawScreen = useCallback(() => {
    const canvas = screenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 900;
    const H = 600;

    // Background
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(0, 0, W, H);

    // Outer frame
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    buttonsRef.current.clear();

    // Top bar area
    const topBarY = 30;
    const topBarH = 50;
    
    // Bottom bar
    const bottomBarY = H - 60;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(20, bottomBarY, W - 40, 40);
    
    // Version text
    ctx.fillStyle = "#5BA8A0";
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("V-1", 35, bottomBarY + 28);

    if (phase === "prompt") {
      // Input field
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, topBarY, 620, topBarH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, topBarY, 620, topBarH);

      // Input text
      ctx.fillStyle = prompt ? "#1a1a1a" : "#888";
      ctx.font = "18px monospace";
      const displayText = prompt || "Describe your API...";
      const truncated = displayText.length > 50 ? displayText.slice(-50) : displayText;
      ctx.fillText(truncated, 45, topBarY + 32);

      // Cursor
      if (isFocused && cursorVisible && prompt.length < 50) {
        const textWidth = ctx.measureText(prompt || "").width;
        ctx.fillStyle = "#5BA8A0";
        ctx.fillRect(45 + textWidth, topBarY + 12, 2, 26);
      }

      // Import button
      const importBtnX = 680;
      const importBtnW = 90;
      ctx.fillStyle = hoveredButton === "import" ? "#e8e8e0" : "#f5f5f0";
      ctx.fillRect(importBtnX, topBarY, importBtnW, topBarH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(importBtnX, topBarY, importBtnW, topBarH);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("import", importBtnX + importBtnW/2, topBarY + 32);
      ctx.textAlign = "left";

      buttonsRef.current.set("import", { x: importBtnX, y: topBarY, w: importBtnW, h: topBarH, action: () => {} });

      // Main content area
      const mainY = 100;
      const mainH = 340;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, mainY, 720, mainH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, mainY, 720, mainH);

      // Content inside main area
      ctx.fillStyle = "#666";
      ctx.font = "20px monospace";
      ctx.textAlign = "center";
      if (prompt.length < 10) {
        ctx.fillText("Enter at least 10 characters to continue", 390, mainY + 160);
        ctx.fillStyle = "#999";
        ctx.font = "14px monospace";
        ctx.fillText(`${prompt.length}/10 characters`, 390, mainY + 190);
      } else {
        ctx.fillStyle = "#5BA8A0";
        ctx.fillText("Ready to generate your API", 390, mainY + 150);
        ctx.fillStyle = "#666";
        ctx.font = "14px monospace";
        ctx.fillText("Click 'export' to continue", 390, mainY + 180);
      }
      ctx.textAlign = "left";

      // Export button
      const exportBtnX = 780;
      const exportBtnY = mainY + 200;
      const exportBtnW = 90;
      const exportBtnH = 50;
      const canExport = prompt.length >= 10;
      ctx.fillStyle = canExport ? (hoveredButton === "export" ? "#4a9890" : "#5BA8A0") : "#ccc";
      ctx.fillRect(exportBtnX, exportBtnY, exportBtnW, exportBtnH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(exportBtnX, exportBtnY, exportBtnW, exportBtnH);
      ctx.fillStyle = canExport ? "#fff" : "#888";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("export", exportBtnX + exportBtnW/2, exportBtnY + 32);
      ctx.textAlign = "left";

      if (canExport) {
        buttonsRef.current.set("export", { x: exportBtnX, y: exportBtnY, w: exportBtnW, h: exportBtnH, action: () => {
          if (!isGenerating) generateTailoredQuestions(prompt);
        }});
      }
    }

    if (phase === "questions" && tailoredQuestions[currentQuestionIndex]) {
      const q = tailoredQuestions[currentQuestionIndex];

      // Top bar with question
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, topBarY, 740, topBarH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, topBarY, 740, topBarH);
      
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 18px monospace";
      ctx.fillText(q.question, 45, topBarY + 32);

      // Progress indicator
      ctx.fillStyle = "#888";
      ctx.font = "14px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${currentQuestionIndex + 1}/${tailoredQuestions.length}`, 755, topBarY + 32);
      ctx.textAlign = "left";

      // Main content area with options
      const mainY = 100;
      const mainH = 340;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, mainY, 720, mainH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, mainY, 720, mainH);

      // Option buttons
      const optW = 160;
      const optH = 80;
      const startX = 60;
      const startY = mainY + 80;
      const gap = 20;

      q.options.forEach((opt, i) => {
        const x = startX + i * (optW + gap);
        const sel = answers[q.id] === opt;
        const hov = hoveredButton === `opt-${opt}`;

        ctx.fillStyle = sel ? "#5BA8A0" : hov ? "#e8e8e0" : "#f5f5f0";
        ctx.fillRect(x, startY, optW, optH);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#1a1a1a";
        ctx.lineWidth = sel ? 4 : 2;
        ctx.strokeRect(x, startY, optW, optH);

        ctx.fillStyle = sel ? "#fff" : "#1a1a1a";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(opt, x + optW/2, startY + 45);
        ctx.textAlign = "left";

        buttonsRef.current.set(`opt-${opt}`, { x, y: startY, w: optW, h: optH, action: () => handleOptionSelect(q.id, opt) });
      });

      // Progress bar
      const barY = mainY + 280;
      tailoredQuestions.forEach((_, i) => {
        const bx = 60 + i * 240;
        ctx.fillStyle = i < currentQuestionIndex ? "#5BA8A0" : i === currentQuestionIndex ? "#5BA8A080" : "#ddd";
        ctx.fillRect(bx, barY, 220, 8);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, barY, 220, 8);
      });
    }

    if (phase === "brand" && suggestions) {
      // Top bar with title
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, topBarY, 740, topBarH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, topBarY, 740, topBarH);
      
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 18px monospace";
      ctx.fillText("Customize Your API Brand", 45, topBarY + 32);

      // Main content area
      const mainY = 100;
      const mainH = 340;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, mainY, 720, mainH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, mainY, 720, mainH);

      // Names section
      ctx.fillStyle = "#888";
      ctx.font = "12px monospace";
      ctx.fillText("NAME", 50, mainY + 30);

      let x = 50;
      suggestions.names.forEach((n) => {
        const w = Math.max(ctx.measureText(n).width + 30, 90);
        const sel = selectedName === n;
        const hov = hoveredButton === `name-${n}`;

        ctx.fillStyle = sel ? "#5BA8A0" : hov ? "#e8e8e0" : "#f5f5f0";
        ctx.fillRect(x, mainY + 40, w, 36);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#1a1a1a";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, mainY + 40, w, 36);

        ctx.fillStyle = sel ? "#fff" : "#1a1a1a";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(n, x + w/2, mainY + 64);
        ctx.textAlign = "left";

        buttonsRef.current.set(`name-${n}`, { x, y: mainY + 40, w, h: 36, action: () => setSelectedName(n) });
        x += w + 15;
      });

      // Icons section
      ctx.fillStyle = "#888";
      ctx.font = "12px monospace";
      ctx.fillText("ICON", 50, mainY + 105);

      const iconSymbols: Record<string, string> = { Zap: "Z", Target: "T", Sparkles: "S", Rocket: "R", Brain: "B", Cpu: "C" };
      x = 50;
      suggestions.icons.forEach((icon) => {
        const sel = selectedIcon === icon;
        const hov = hoveredButton === `icon-${icon}`;

        ctx.fillStyle = sel ? "#5BA8A0" : hov ? "#e8e8e0" : "#f5f5f0";
        ctx.fillRect(x, mainY + 115, 50, 50);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#1a1a1a";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, mainY + 115, 50, 50);

        ctx.fillStyle = sel ? "#fff" : "#1a1a1a";
        ctx.font = "bold 22px monospace";
        ctx.textAlign = "center";
        ctx.fillText(iconSymbols[icon] || "?", x + 25, mainY + 148);
        ctx.textAlign = "left";

        buttonsRef.current.set(`icon-${icon}`, { x, y: mainY + 115, w: 50, h: 50, action: () => setSelectedIcon(icon) });
        x += 60;
      });

      // Palettes section
      ctx.fillStyle = "#888";
      ctx.font = "12px monospace";
      ctx.fillText("PALETTE", 50, mainY + 195);

      x = 50;
      suggestions.palettes.forEach((p) => {
        const sel = selectedPalette?.name === p.name;
        const hov = hoveredButton === `pal-${p.name}`;

        ctx.fillStyle = sel ? "#5BA8A020" : hov ? "#e8e8e0" : "#f5f5f0";
        ctx.fillRect(x, mainY + 205, 160, 90);
        ctx.strokeStyle = sel ? "#5BA8A0" : "#1a1a1a";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeRect(x, mainY + 205, 160, 90);

        // Color swatches
        ctx.fillStyle = p.colors.primary;
        ctx.fillRect(x + 15, mainY + 220, 55, 40);
        ctx.fillStyle = p.colors.accent;
        ctx.fillRect(x + 85, mainY + 220, 55, 40);

        ctx.fillStyle = sel ? "#5BA8A0" : "#1a1a1a";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.name, x + 80, mainY + 285);
        ctx.textAlign = "left";

        buttonsRef.current.set(`pal-${p.name}`, { x, y: mainY + 205, w: 160, h: 90, action: () => setSelectedPalette(p) });
        x += 175;
      });

      // Export/Create button
      const exportBtnX = 780;
      const exportBtnY = mainY + 200;
      const exportBtnW = 90;
      const exportBtnH = 50;
      const canCreate = selectedName && selectedIcon && selectedPalette;
      
      ctx.fillStyle = canCreate ? (hoveredButton === "create" ? "#4a9890" : "#5BA8A0") : "#ccc";
      ctx.fillRect(exportBtnX, exportBtnY, exportBtnW, exportBtnH);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.strokeRect(exportBtnX, exportBtnY, exportBtnW, exportBtnH);
      ctx.fillStyle = canCreate ? "#fff" : "#888";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("create", exportBtnX + exportBtnW/2, exportBtnY + 32);
      ctx.textAlign = "left";

      if (canCreate) {
        buttonsRef.current.set("create", { x: exportBtnX, y: exportBtnY, w: exportBtnW, h: exportBtnH, action: () => {
          onComplete({ prompt, name: selectedName!, icon: selectedIcon!, palette: selectedPalette!.colors });
        }});
      }
    }

    // Loading overlay
    if (isGenerating) {
      ctx.fillStyle = "rgba(245, 245, 240, 0.9)";
      ctx.fillRect(30, 100, 720, 340);
      ctx.fillStyle = "#5BA8A0";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Generating...", 390, 280);
      ctx.textAlign = "left";
    }

    if (screenTextureRef.current) screenTextureRef.current.needsUpdate = true;
  }, [phase, prompt, isGenerating, tailoredQuestions, currentQuestionIndex, answers, suggestions, selectedName, selectedIcon, selectedPalette, hoveredButton, isFocused, cursorVisible, onComplete]);

  const generateTailoredQuestions = useCallback(async (userPrompt: string) => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    
    const words = userPrompt.toLowerCase();
    const questions: TailoredQuestion[] = [];
    
    if (words.includes("analyz") || words.includes("review") || words.includes("sentiment")) {
      questions.push({ id: "depth", question: "Analysis depth?", options: ["Quick", "Standard", "Deep", "Full"] });
    } else if (words.includes("generat") || words.includes("creat") || words.includes("write")) {
      questions.push({ id: "creativity", question: "Creativity level?", options: ["Low", "Medium", "High", "Max"] });
    } else {
      questions.push({ id: "style", question: "Processing style?", options: ["Fast", "Balanced", "Thorough", "Max"] });
    }
    
    questions.push({ id: "output", question: "Output detail?", options: ["Brief", "Standard", "Detailed", "Full"] });
    questions.push({ id: "tone", question: "Response tone?", options: ["Pro", "Friendly", "Tech", "Casual"] });
    
    setTailoredQuestions(questions);
    setPhase("questions");
    setIsGenerating(false);
  }, []);

  const generateBrandSuggestions = useCallback(async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 400));
    
    const words = prompt.split(" ");
    const keyword = words.find(w => w.length > 3) || "API";
    const cap = keyword.charAt(0).toUpperCase() + keyword.slice(1, 6).toLowerCase();
    
    const mock: BrandSuggestion = {
      names: [`${cap}AI`, `${cap}Pro`, `Smart${cap}`],
      icons: ["Zap", "Target", "Sparkles", "Rocket", "Brain", "Cpu"],
      palettes: [
        { name: "Svivva", colors: { primary: "#5BA8A0", secondary: "#4a9890", accent: "#6B2C4A" } },
        { name: "Ocean", colors: { primary: "#0ea5e9", secondary: "#0284c7", accent: "#06b6d4" } },
        { name: "Violet", colors: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#a855f7" } },
        { name: "Ember", colors: { primary: "#f97316", secondary: "#ea580c", accent: "#fbbf24" } },
      ],
    };
    
    setSuggestions(mock);
    setSelectedName(mock.names[0]);
    setSelectedIcon(mock.icons[0]);
    setSelectedPalette(mock.palettes[0]);
    setPhase("brand");
    setIsGenerating(false);
  }, [prompt]);

  const handleOptionSelect = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => {
      if (currentQuestionIndex < tailoredQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        generateBrandSuggestions();
      }
    }, 200);
  }, [currentQuestionIndex, tailoredQuestions.length, generateBrandSuggestions]);

  useEffect(() => {
    drawScreen();
  }, [drawScreen]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a22);

    // Orthographic camera for flat view - fit panel exactly
    const panelAspect = 900 / 600; // 1.5
    const containerAspect = width / height;
    
    let frustumWidth, frustumHeight;
    if (containerAspect > panelAspect) {
      // Container is wider - fit to height
      frustumHeight = 6.5;
      frustumWidth = frustumHeight * containerAspect;
    } else {
      // Container is taller - fit to width
      frustumWidth = 9.5;
      frustumHeight = frustumWidth / containerAspect;
    }
    
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2, frustumWidth / 2,
      frustumHeight / 2, -frustumHeight / 2,
      0.1, 100
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Panel canvas
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 900;
    screenCanvas.height = 600;
    screenCanvasRef.current = screenCanvas;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTextureRef.current = screenTexture;

    // Main panel
    const panelMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const panelGeom = new THREE.PlaneGeometry(9, 6);
    const panel = new THREE.Mesh(panelGeom, panelMat);
    panelMeshRef.current = panel;
    scene.add(panel);

    drawScreen();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = container.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const intersects = raycaster.intersectObject(panel);

      if (intersects.length > 0 && intersects[0].uv) {
        return {
          x: intersects[0].uv.x * 900,
          y: (1 - intersects[0].uv.y) * 600
        };
      }
      return null;
    };

    const handleClick = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.changedTouches[0]?.clientX || 0 : e.clientX;
      const clientY = "touches" in e ? e.changedTouches[0]?.clientY || 0 : e.clientY;

      setIsFocused(true);
      hiddenInputRef.current?.focus();

      const coords = getCanvasCoords(clientX, clientY);
      if (coords) {
        buttonsRef.current.forEach((btn) => {
          if (coords.x >= btn.x && coords.x <= btn.x + btn.w && coords.y >= btn.y && coords.y <= btn.y + btn.h) {
            btn.action();
          }
        });
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX || 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY || 0 : e.clientY;

      let found: string | null = null;
      const coords = getCanvasCoords(clientX, clientY);
      if (coords) {
        buttonsRef.current.forEach((btn, key) => {
          if (coords.x >= btn.x && coords.x <= btn.x + btn.w && coords.y >= btn.y && coords.y <= btn.y + btn.h) {
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
      const contAspect = w / h;
      
      let fW, fH;
      if (contAspect > panelAspect) {
        fH = 6.5;
        fW = fH * contAspect;
      } else {
        fW = 9.5;
        fH = fW / contAspect;
      }
      
      camera.left = -fW / 2;
      camera.right = fW / 2;
      camera.top = fH / 2;
      camera.bottom = -fH / 2;
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
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && prompt.length >= 10 && !isGenerating && phase === "prompt") {
      generateTailoredQuestions(prompt);
    }
  }, [prompt, isGenerating, phase, generateTailoredQuestions]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[500px] sm:h-[550px] rounded-lg overflow-hidden" />
      
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
      
      <p className="text-center text-xs text-muted-foreground mt-3">
        Click the panel to focus, then type your prompt
      </p>
    </div>
  );
}
