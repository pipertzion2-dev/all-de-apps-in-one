"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { 
  Zap, Brain, Sparkles, Target, Rocket, Shield, Globe, Code,
  MessageSquare, Image, FileText, BarChart, Database, Lock,
  Cpu, Layers, Bot, Wand2, Flame, Heart, Star, Gem,
  Crown, Trophy, Lightbulb, Compass, Anchor, Feather,
  ChevronLeft, ChevronRight, Play, Square, Import, Upload,
  Palette, Briefcase, Smile, Check, ArrowRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Brain, Sparkles, Target, Rocket, Shield, Globe, Code,
  MessageSquare, Image, FileText, BarChart, Database, Lock,
  Cpu, Layers, Bot, Wand2, Flame, Heart, Star, Gem,
  Crown, Trophy, Lightbulb, Compass, Anchor, Feather,
  Palette, Briefcase, Smile
};

interface OnboardingQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    icon: string;
    description?: string;
  }[];
}

interface BrandSuggestion {
  names: string[];
  icons: string[];
  palettes: { name: string; colors: { primary: string; secondary: string; accent: string } }[];
}

interface ApiInstrumentProps {
  projectId: string;
  onComplete?: (data: { name: string; icon: string; palette: { primary: string; secondary: string; accent: string } }) => void;
  initialPrompt?: string;
}

type InstrumentMode = "define" | "train" | "brand" | "test";

interface TrainingExample {
  id: string;
  input: string;
  output: Record<string, unknown>;
  sortOrder: number;
}

function TrainModeScreen({ projectId }: { projectId: string }) {
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [newOutput, setNewOutput] = useState("{}");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [editOutput, setEditOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccessMsg(null);
    setTimeout(() => setError(null), 5000);
  };

  const loadExamples = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/training-data`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setExamples(data.examples || []);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load training data");
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadExamples();
  }, [loadExamples]);

  const handleAdd = async () => {
    try {
      let parsedOutput: Record<string, unknown>;
      try {
        parsedOutput = JSON.parse(newOutput);
      } catch {
        showError("Invalid JSON in output field. Please enter valid JSON.");
        return;
      }
      
      const res = await fetch(`/api/projects/${projectId}/training-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: newInput, output: parsedOutput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      
      setNewInput("");
      setNewOutput("{}");
      setIsAdding(false);
      showSuccess("Example added successfully!");
      loadExamples();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add example");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/training-data/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      
      showSuccess("Example deleted!");
      loadExamples();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete example");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      let parsedOutput: Record<string, unknown>;
      try {
        parsedOutput = JSON.parse(editOutput);
      } catch {
        showError("Invalid JSON in output field. Please enter valid JSON.");
        return;
      }
      
      const res = await fetch(`/api/projects/${projectId}/training-data/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: editInput, output: parsedOutput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      
      setEditingId(null);
      showSuccess("Example updated!");
      loadExamples();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update example");
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/training-data`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to export");
      
      const exportData = {
        projectId,
        exportedAt: new Date().toISOString(),
        examples: data.examples?.map((e: TrainingExample) => ({
          input: e.input,
          output: e.output,
        })) || [],
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training-data-${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess("Training data exported!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to export");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch {
        showError("Invalid JSON file. Please upload a valid JSON file.");
        e.target.value = "";
        return;
      }
      
      const res = await fetch(`/api/projects/${projectId}/training-data/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          format: "json", 
          data: JSON.stringify(jsonData.examples || jsonData)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import");
      
      showSuccess(`Imported ${data.imported} examples!`);
      loadExamples();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to import");
    }
    e.target.value = "";
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5, minApproved: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      showSuccess(`Generated ${data.approved || 0} training examples!`);
      loadExamples();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to generate training data");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 text-sm font-mono">TRAIN MODE</span>
          <Badge variant="outline" className="text-amber-400/70 border-amber-400/30 ml-2">
            {examples.length} examples
          </Badge>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileImport}
            data-testid="input-file-import"
          />
          <Button size="sm" variant="outline" className="gap-1" onClick={handleImportClick} data-testid="button-import">
            <Import className="w-3 h-3" /> Import
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExport} data-testid="button-export">
            <Upload className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-sm" data-testid="alert-error">
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="mb-3 p-2 rounded bg-green-500/20 border border-green-500/30 text-green-300 text-sm" data-testid="alert-success">
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {examples.length === 0 && !isAdding ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
              <p className="text-gray-400 mb-4">No training examples yet</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={() => setIsAdding(true)} className="bg-amber-500" data-testid="button-add-first">
                  Add Custom Example
                </Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} data-testid="button-generate">
                  <Sparkles className="w-3 h-3 mr-1" /> Generate with AI
                </Button>
              </div>
            </div>
          ) : (
            <>
              {isAdding && (
                <div className="p-3 rounded-lg border-2 border-amber-400/50 bg-amber-400/10 space-y-2">
                  <input
                    type="text"
                    placeholder="Input..."
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/30 border border-white/10 text-white text-sm"
                    data-testid="input-new-example"
                  />
                  <Textarea
                    placeholder='Output JSON: {"key": "value"}'
                    value={newOutput}
                    onChange={(e) => setNewOutput(e.target.value)}
                    className="bg-black/30 border-white/10 text-white text-sm h-20"
                    data-testid="input-new-output"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} data-testid="button-cancel-add">Cancel</Button>
                    <Button size="sm" className="bg-amber-500" onClick={handleAdd} disabled={!newInput.trim()} data-testid="button-save-add">Save</Button>
                  </div>
                </div>
              )}

              {examples.map((ex) => (
                <div 
                  key={ex.id} 
                  className="p-3 rounded-lg border border-white/10 bg-white/5 group hover:border-amber-400/30 transition-colors"
                  data-testid={`example-${ex.id}`}
                >
                  {editingId === ex.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-black/30 border border-white/10 text-white text-sm"
                        data-testid={`input-edit-${ex.id}`}
                      />
                      <Textarea
                        value={editOutput}
                        onChange={(e) => setEditOutput(e.target.value)}
                        className="bg-black/30 border-white/10 text-white text-sm h-20"
                        data-testid={`input-edit-output-${ex.id}`}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-${ex.id}`}>Cancel</Button>
                        <Button size="sm" className="bg-amber-500" onClick={() => handleUpdate(ex.id)} data-testid={`button-save-edit-${ex.id}`}>Update</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-1">Input</div>
                          <div className="text-sm text-white truncate">{ex.input}</div>
                        </div>
                        <div className="flex gap-1 invisible group-hover:visible">
                          <button
                            onClick={() => {
                              setEditingId(ex.id);
                              setEditInput(ex.input);
                              setEditOutput(JSON.stringify(ex.output, null, 2));
                            }}
                            className="p-1 rounded hover-elevate"
                            data-testid={`button-edit-${ex.id}`}
                          >
                            <Wand2 className="w-3 h-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(ex.id)}
                            className="p-1 rounded hover-elevate"
                            data-testid={`button-delete-${ex.id}`}
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Output</div>
                        <pre className="text-xs text-green-400 bg-black/30 p-2 rounded overflow-auto max-h-20">
                          {JSON.stringify(ex.output, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {!isAdding && examples.length > 0 && (
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} data-testid="button-add-more">
                    Add Custom
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerate} data-testid="button-generate-more">
                    <Sparkles className="w-3 h-3 mr-1" /> Generate More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TestModeScreen({ projectId }: { projectId: string }) {
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<Record<string, unknown> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestOutput(null);
    const startTime = Date.now();

    try {
      const res = await fetch(`/api/runtime/${projectId}/main`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput }),
      });
      const data = await res.json();
      setLatency(Date.now() - startTime);
      
      if (!res.ok) {
        setError(data.error || "Request failed");
      } else {
        setTestOutput(data.output || data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLatency(Date.now() - startTime);
    }
    setIsRunning(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-sm font-mono">TEST MODE</span>
        </div>
        {latency !== null && (
          <Badge variant="outline" className="text-blue-400/70 border-blue-400/30">
            {latency}ms
          </Badge>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Input</label>
          <Textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter test input..."
            className="flex-1 bg-black/30 border-white/10 text-white resize-none"
            data-testid="input-test"
          />
        </div>

        <Button 
          onClick={runTest} 
          disabled={isRunning || !testInput.trim()}
          className="bg-blue-500 gap-2"
          data-testid="button-run-test"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Test
            </>
          )}
        </Button>

        <div className="flex-1 flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Output</label>
          <div 
            className={`flex-1 rounded-lg p-3 overflow-auto ${
              error ? "bg-red-500/10 border border-red-500/30" : "bg-black/30 border border-white/10"
            }`}
            data-testid="container-test-output"
          >
            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : testOutput ? (
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
                {JSON.stringify(testOutput, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-sm">Output will appear here...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CRT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CRT_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform vec3 glowColor;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    float scanline = sin(uv.y * 400.0) * 0.04;
    float vignette = 1.0 - length((uv - 0.5) * 1.3);
    vignette = clamp(vignette, 0.0, 1.0);
    
    vec4 color = texture2D(tDiffuse, uv);
    color.rgb += scanline;
    color.rgb *= vignette;
    color.rgb += glowColor * 0.1 * (0.5 + 0.5 * sin(time * 2.0));
    
    gl_FragColor = color;
  }
`;

export function ApiInstrument({ projectId, onComplete, initialPrompt = "" }: ApiInstrumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number>(0);
  
  const [mode, setMode] = useState<InstrumentMode>("define");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [suggestions, setSuggestions] = useState<BrandSuggestion | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<{ name: string; colors: { primary: string; secondary: string; accent: string } } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));

  useEffect(() => {
    fetch(`/api/projects/${projectId}/suggestions`)
      .then(res => res.json())
      .then(data => {
        if (data.questions) setQuestions(data.questions);
        if (data.brand) {
          setSuggestions({
            names: data.brand.suggestedNames || [],
            icons: data.brand.suggestedIcons || [],
            palettes: data.brand.suggestedPalettes || [],
          });
          if (data.brand.brandName) setSelectedName(data.brand.brandName);
          if (data.brand.icon) setSelectedIcon(data.brand.icon);
          if (data.brand.colorPalette) {
            const matchingPalette = data.brand.suggestedPalettes?.find(
              (p: { colors: { primary: string } }) => p.colors.primary === data.brand.colorPalette?.primary
            );
            if (matchingPalette) setSelectedPalette(matchingPalette);
          }
        }
      })
      .catch(console.error);
  }, [projectId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformData(prev => 
        prev.map((_, i) => {
          const base = Math.sin(Date.now() * 0.002 + i * 0.3) * 0.3;
          const noise = (Math.random() - 0.5) * 0.2;
          return 0.5 + base + noise;
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const createInstrumentCase = useCallback(() => {
    const group = new THREE.Group();

    const caseGeometry = new THREE.BoxGeometry(6, 0.5, 4);
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.1,
      roughness: 0.8,
    });
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial);
    caseMesh.position.y = 0.25;
    caseMesh.receiveShadow = true;
    caseMesh.castShadow = true;
    group.add(caseMesh);

    const bevelGeometry = new THREE.BoxGeometry(6.1, 0.1, 4.1);
    const bevelMesh = new THREE.Mesh(bevelGeometry, caseMaterial);
    bevelMesh.position.y = 0.55;
    group.add(bevelMesh);

    const frontPanelGeometry = new THREE.BoxGeometry(6, 0.8, 0.5);
    const frontPanelMesh = new THREE.Mesh(frontPanelGeometry, caseMaterial);
    frontPanelMesh.position.set(0, 0.1, 2.25);
    frontPanelMesh.rotation.x = -0.2;
    group.add(frontPanelMesh);

    return group;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x5BA8A0, 0.5);
    rimLight.position.set(-3, 2, 2);
    scene.add(rimLight);

    const caseGroup = createInstrumentCase();
    scene.add(caseGroup);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [createInstrumentCase]);

  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "complete",
          context: { prompt, existingAnswers: answers }
        })
      });
      const data = await response.json();
      if (data.branding) {
        setSuggestions(data.branding);
        setMode("brand");
      }
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }
    setIsLoading(false);
  }, [projectId, prompt, answers]);

  const handleAnswerSelect = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      void generateSuggestions();
    }
  }, [currentQuestionIndex, questions.length, generateSuggestions]);

  const handleComplete = useCallback(() => {
    if (selectedName && selectedIcon && selectedPalette && onComplete) {
      onComplete({
        name: selectedName,
        icon: selectedIcon,
        palette: selectedPalette.colors,
      });
    }
  }, [selectedName, selectedIcon, selectedPalette, onComplete]);

  const currentQuestion = questions[currentQuestionIndex];

  const renderScreen = useMemo(() => {
    switch (mode) {
      case "define":
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[#5BA8A0] text-sm font-mono">DEFINE MODE</span>
              </div>
              <Badge variant="outline" className="text-[#5BA8A0] border-[#5BA8A0]/30">
                Step {currentQuestionIndex + 1}/{questions.length || 3}
              </Badge>
            </div>
            
            {currentQuestion ? (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">{currentQuestion.question}</h2>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {currentQuestion.options.map((option) => {
                    const IconComponent = ICON_MAP[option.icon] || Zap;
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                        className={`group relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover-elevate ${
                          isSelected
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/20"
                            : "border-white/10 bg-white/5 hover:border-[#5BA8A0]/50"
                        }`}
                        data-testid={`option-${option.value}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-[#5BA8A0]" : "bg-white/10 group-hover:bg-[#5BA8A0]/30"}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-[#5BA8A0]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">Describe your API</h2>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., An API that analyzes customer reviews and extracts sentiment, key topics, and actionable insights..."
                  className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-gray-500 resize-none"
                  data-testid="input-prompt"
                />
                <Button
                  onClick={() => setCurrentQuestionIndex(0)}
                  disabled={!prompt.trim()}
                  className="mt-4 bg-[#5BA8A0] hover:bg-[#4a9890]"
                  data-testid="button-continue"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        );

      case "brand":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6B3A67] animate-pulse" />
                <span className="text-[#6B3A67] text-sm font-mono">BRAND MODE</span>
              </div>
              {selectedName && selectedIcon && selectedPalette && (
                <Button size="sm" onClick={handleComplete} className="bg-[#5BA8A0]" data-testid="button-finalize">
                  Finalize Brand
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {suggestions?.names && suggestions.names.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Choose a Name</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {suggestions.names.map((name) => (
                      <button
                        key={name}
                        onClick={() => setSelectedName(name)}
                        className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                          selectedName === name
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/20 text-white"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-[#5BA8A0]/50"
                        }`}
                        data-testid={`name-${name}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions?.icons && suggestions.icons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Choose an Icon</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {suggestions.icons.map((iconName) => {
                      const IconComponent = ICON_MAP[iconName] || Zap;
                      return (
                        <button
                          key={iconName}
                          onClick={() => setSelectedIcon(iconName)}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center ${
                            selectedIcon === iconName
                              ? "border-[#5BA8A0] bg-[#5BA8A0]/20"
                              : "border-white/10 bg-white/5 hover:border-[#5BA8A0]/50"
                          }`}
                          data-testid={`icon-${iconName}`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestions?.palettes && suggestions.palettes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Choose a Color Palette</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {suggestions.palettes.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => setSelectedPalette(palette)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedPalette?.name === palette.name
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/10"
                            : "border-white/10 bg-white/5 hover:border-[#5BA8A0]/50"
                        }`}
                        data-testid={`palette-${palette.name}`}
                      >
                        <div className="flex gap-1 mb-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors.primary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors.secondary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors.accent }} />
                        </div>
                        <div className="text-xs text-gray-400">{palette.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "train":
        return (
          <TrainModeScreen projectId={projectId} />
        );

      case "test":
        return (
          <TestModeScreen projectId={projectId} />
        );
    }
  }, [mode, currentQuestion, currentQuestionIndex, questions, answers, prompt, suggestions, selectedName, selectedIcon, selectedPalette, handleAnswerSelect, handleComplete, projectId]);

  return (
    <div className="relative w-full h-[700px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10">
      <div ref={containerRef} className="absolute inset-0 opacity-30" />
      
      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex-1 flex gap-6">
          <div className="flex-1 relative">
            <div 
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(20,20,30,0.95) 100%)",
                boxShadow: "inset 0 0 30px rgba(91, 168, 160, 0.2), 0 0 20px rgba(0,0,0,0.5)",
                border: "2px solid rgba(91, 168, 160, 0.3)",
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
                }}
              />
              
              <div className="relative z-10 p-6 h-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-[#5BA8A0]/30 border-t-[#5BA8A0] rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-400">Generating suggestions...</p>
                    </div>
                  </div>
                ) : (
                  renderScreen
                )}
              </div>
            </div>
          </div>

          <div className="w-24 flex flex-col gap-4">
            <button
              onClick={() => setMode("define")}
              className={`flex-1 rounded-xl transition-all ${
                mode === "define" 
                  ? "bg-gradient-to-br from-[#5BA8A0] to-[#4A9790]" 
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{
                boxShadow: mode === "define" ? "0 0 20px rgba(91, 168, 160, 0.5)" : "none",
              }}
              data-testid="button-mode-define"
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                <Wand2 className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-medium">DEFINE</span>
              </div>
            </button>

            <button
              onClick={() => setMode("train")}
              className={`flex-1 rounded-xl transition-all ${
                mode === "train" 
                  ? "bg-gradient-to-br from-amber-500 to-amber-600" 
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{
                boxShadow: mode === "train" ? "0 0 20px rgba(245, 158, 11, 0.5)" : "none",
              }}
              data-testid="button-mode-train"
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                <Brain className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-medium">TRAIN</span>
              </div>
            </button>

            <button
              onClick={() => setMode("brand")}
              className={`flex-1 rounded-xl transition-all ${
                mode === "brand" 
                  ? "bg-gradient-to-br from-purple-500 to-purple-600" 
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{
                boxShadow: mode === "brand" ? "0 0 20px rgba(168, 85, 247, 0.5)" : "none",
              }}
              data-testid="button-mode-brand"
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                <Palette className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-medium">BRAND</span>
              </div>
            </button>

            <button
              onClick={() => setMode("test")}
              className={`flex-1 rounded-xl transition-all ${
                mode === "test" 
                  ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{
                boxShadow: mode === "test" ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none",
              }}
              data-testid="button-mode-test"
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                <Play className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-medium">TEST</span>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div 
            className="flex-1 h-16 rounded-lg overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, 
                rgba(91, 168, 160, 0.6), 
                rgba(107, 44, 74, 0.6), 
                rgba(180, 160, 200, 0.6), 
                rgba(150, 200, 180, 0.6),
                rgba(200, 180, 210, 0.6)
              )`,
              backgroundSize: "400% 400%",
              animation: "camoShift 8s ease infinite",
            }}
          >
            <div className="absolute inset-0 flex items-end justify-around px-4 pb-2">
              {waveformData.map((value, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/60 rounded-full transition-all duration-75"
                  style={{ height: `${value * 40}px` }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {[ChevronLeft, ChevronLeft, Play, Square, ChevronRight].map((Icon, i) => (
              <button
                key={i}
                className="w-12 h-12 rounded-lg bg-gradient-to-b from-zinc-300 to-zinc-400 shadow-lg flex items-center justify-center hover-elevate active-elevate-2"
                style={{
                  boxShadow: "0 4px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)",
                }}
                data-testid={`button-control-${i}`}
              >
                <Icon className="w-5 h-5 text-zinc-700" style={{ transform: i === 0 || i === 1 ? "scaleX(-1)" : "none" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes camoShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
