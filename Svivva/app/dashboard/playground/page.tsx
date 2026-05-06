"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/use-auth";
import { Play, Loader2, Clock, CheckCircle, XCircle, Copy, Code, Share2, Link2, Users, Plus, Eye, Trash2, ExternalLink, Globe, Lock } from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  systemPrompt: string;
  outputSchema: Record<string, unknown>;
  status: string;
}

interface PlaygroundSession {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  shareToken: string | null;
  viewCount: number;
  allowEditing: boolean;
  savedRequest: { method: string; headers: Record<string, string>; body: string } | null;
  savedResponse: { status: number; body: unknown; latencyMs: number; timestamp: string } | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; slug: string };
}

interface PlaygroundResponse {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  latency: number;
  timestamp: string;
  repaired?: boolean;
  attempts?: number;
}

export default function PlaygroundPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [sessionVisibility, setSessionVisibility] = useState<"private" | "link" | "public">("private");
  const [allowEditing, setAllowEditing] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await authFetch("/api/projects");
      return res.json();
    },
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/playground"],
    queryFn: async () => {
      const res = await authFetch("/api/playground");
      return res.json();
    },
  });

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const sessions: PlaygroundSession[] = sessionsData?.sessions || [];
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  useEffect(() => {
    if (selectedSession?.savedRequest) {
      setInputText(selectedSession.savedRequest.body || "");
    }
    if (selectedSession?.savedResponse) {
      setResponse({
        success: selectedSession.savedResponse.status === 200,
        output: selectedSession.savedResponse.body as Record<string, unknown>,
        latency: selectedSession.savedResponse.latencyMs,
        timestamp: selectedSession.savedResponse.timestamp,
      });
    }
  }, [selectedSession]);

  const createSessionMutation = useMutation({
    mutationFn: async (data: { projectId: string; name: string; description?: string; visibility: string; allowEditing: boolean }) => {
      const res = await authFetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playground"] });
      setSelectedSessionId(data.session.id);
      setShowNewSessionDialog(false);
      setNewSessionName("");
      setNewSessionDescription("");
      toast({ title: "Playground created", description: "Your new playground session is ready." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: string; visibility?: string; allowEditing?: boolean; savedRequest?: unknown; savedResponse?: unknown }) => {
      const res = await authFetch("/api/playground", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playground"] });
      toast({ title: "Settings saved" });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await authFetch(`/api/playground?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playground"] });
      setSelectedSessionId("");
      toast({ title: "Playground deleted" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ projectId, input }: { projectId: string; input: string }) => {
      const startTime = Date.now();
      
      const res = await authFetch("/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, input }),
      });
      
      const data = await res.json();
      const latency = Date.now() - startTime;
      
      return {
        ...data,
        latency,
        timestamp: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      setResponse(data);
      if (selectedSessionId) {
        updateSessionMutation.mutate({
          sessionId: selectedSessionId,
          savedRequest: { method: "POST", headers: { "Content-Type": "application/json" }, body: inputText },
          savedResponse: { status: data.success ? 200 : 500, body: data.output || data.error, latencyMs: data.latency, timestamp: data.timestamp },
        });
      }
    },
    onError: (error: Error) => {
      setResponse({
        success: false,
        error: error.message,
        latency: 0,
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleExecute = () => {
    const projectId = selectedSession?.project?.id || selectedProjectId;
    if (!projectId || !inputText.trim()) {
      toast({
        title: "Missing input",
        description: "Please select a project and enter some input text.",
        variant: "destructive",
      });
      return;
    }
    
    executeMutation.mutate({ projectId, input: inputText });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getShareUrl = () => {
    if (!selectedSession?.shareToken) return "";
    return `${window.location.origin}/playground/${selectedSession.shareToken}`;
  };

  const generateCurlCommand = () => {
    const projectId = selectedSession?.project?.id || selectedProjectId;
    if (!projectId) return "";
    return `curl -X POST "${window.location.origin}/api/playground/execute" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: session=YOUR_SESSION_COOKIE" \\
  -d '${JSON.stringify({ projectId, input: inputText }, null, 2)}'`;
  };

  const handleCreateSession = () => {
    if (!selectedProjectId || !newSessionName.trim()) {
      toast({ title: "Missing fields", description: "Please select a project and enter a name.", variant: "destructive" });
      return;
    }
    createSessionMutation.mutate({
      projectId: selectedProjectId,
      name: newSessionName,
      description: newSessionDescription || undefined,
      visibility: sessionVisibility,
      allowEditing,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-playground-title">API Playground</h1>
          <p className="text-muted-foreground" data-testid="text-playground-description">Test and share your AI APIs with collaborators</p>
        </div>
        <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" style={{ background: "linear-gradient(135deg, #6B3A67, #D782B2, #425884)" }} data-testid="button-new-playground">
              <Plus className="w-4 h-4" />
              New Playground
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shareable Playground</DialogTitle>
              <DialogDescription>Create a playground session to test and share your API</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger data-testid="select-new-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="My API Demo"
                  data-testid="input-session-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="Describe what this playground demonstrates..."
                  rows={2}
                  data-testid="input-session-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={sessionVisibility} onValueChange={(v) => setSessionVisibility(v as "private" | "link" | "public")}>
                  <SelectTrigger data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private - Only you</SelectItem>
                    <SelectItem value="link">Link - Anyone with the link</SelectItem>
                    <SelectItem value="public">Public - Listed publicly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-editing">Allow collaborators to edit</Label>
                <Switch id="allow-editing" checked={allowEditing} onCheckedChange={setAllowEditing} data-testid="switch-allow-editing" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateSession} disabled={createSessionMutation.isPending} data-testid="button-create-session">
                {createSessionMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Playgrounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedSessionId === session.id ? "border-primary bg-muted/30" : "border-border"}`}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    if (session.project) setSelectedProjectId(session.project.id);
                  }}
                  data-testid={`card-session-${session.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{session.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{session.project?.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {session.visibility === "public" ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : session.visibility === "link" ? (
                        <Link2 className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span>{session.viewCount} views</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle data-testid="text-request-title">Request</CardTitle>
                <CardDescription>Configure and send a test request</CardDescription>
              </div>
              {selectedSession && (
                <div className="flex items-center gap-2">
                  <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1" data-testid="button-share">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Playground</DialogTitle>
                        <DialogDescription>Share this playground with others</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Visibility</Label>
                          <Select 
                            value={selectedSession.visibility} 
                            onValueChange={(v) => updateSessionMutation.mutate({ sessionId: selectedSession.id, visibility: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="link">Anyone with link</SelectItem>
                              <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedSession.shareToken && (
                          <div className="space-y-2">
                            <Label>Share Link</Label>
                            <div className="flex gap-2">
                              <Input value={getShareUrl()} readOnly className="font-mono text-sm" />
                              <Button variant="outline" size="icon" onClick={() => copyToClipboard(getShareUrl())} data-testid="button-copy-share-link">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <Label>Allow editing</Label>
                          <Switch 
                            checked={selectedSession.allowEditing} 
                            onCheckedChange={(v) => updateSessionMutation.mutate({ sessionId: selectedSession.id, allowEditing: v })} 
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteSessionMutation.mutate(selectedSession.id)}
                    data-testid="button-delete-session"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSession && (
              <div className="space-y-2">
                <Label htmlFor="project-select">Project</Label>
                <Select 
                  value={selectedProjectId} 
                  onValueChange={setSelectedProjectId}
                  disabled={projectsLoading}
                >
                  <SelectTrigger id="project-select" data-testid="select-project">
                    <SelectValue placeholder={projectsLoading ? "Loading..." : "Select a project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem 
                        key={project.id} 
                        value={project.id}
                        data-testid={`select-item-project-${project.id}`}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedProject || selectedSession?.project) && (
              <div className="p-3 bg-muted rounded-lg space-y-2" data-testid="card-selected-project">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" data-testid="badge-project-status">
                    {selectedSession ? selectedSession.project?.name : selectedProject?.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground" data-testid="text-project-slug">
                    {selectedSession?.project?.slug || selectedProject?.slug}
                  </span>
                </div>
                {selectedSession && (
                  <p className="text-sm font-medium">{selectedSession.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="input-textarea">Input</Label>
              <Textarea
                id="input-textarea"
                placeholder="Enter your input text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                data-testid="input-text"
              />
            </div>

            <Button
              className="w-full gap-2 text-white"
              style={{ background: "linear-gradient(135deg, #6B3A67, #D782B2, #425884)" }}
              onClick={handleExecute}
              disabled={!(selectedSession?.project?.id || selectedProjectId) || !inputText.trim() || executeMutation.isPending}
              data-testid="button-execute"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between" data-testid="text-response-title">
              Response
              {response && (
                <div className="flex items-center gap-2">
                  {response.success ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20" data-testid="badge-response-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-response-error">
                      <XCircle className="w-3 h-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1" data-testid="badge-response-latency">
                    <Clock className="w-3 h-3" />
                    {response.latency}ms
                  </Badge>
                  {response.repaired && (
                    <Badge variant="secondary" data-testid="badge-response-repaired">
                      Auto-repaired
                    </Badge>
                  )}
                </div>
              )}
            </CardTitle>
            <CardDescription>View the API response</CardDescription>
          </CardHeader>
          <CardContent>
            {!response ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground" data-testid="text-response-placeholder">
                <p>Run a request to see the response</p>
              </div>
            ) : (
              <Tabs defaultValue="response">
                <TabsList className="mb-4">
                  <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
                  <TabsTrigger value="curl" data-testid="tab-curl">cURL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="response" className="space-y-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(JSON.stringify(response.output || response.error, null, 2))}
                      data-testid="button-copy-response"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-64 text-sm font-mono" data-testid="text-response-output">
                      {response.success 
                        ? JSON.stringify(response.output, null, 2)
                        : response.error
                      }
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-response-timestamp">
                    Executed at {new Date(response.timestamp).toLocaleString()}
                    {response.attempts && response.attempts > 1 && ` (${response.attempts} attempts)`}
                  </p>
                </TabsContent>

                <TabsContent value="curl">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateCurlCommand())}
                      data-testid="button-copy-curl"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-64 text-sm font-mono whitespace-pre-wrap" data-testid="text-curl-command">
                      {generateCurlCommand()}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {(selectedProject?.outputSchema || selectedSession) && (selectedProject?.outputSchema && Object.keys(selectedProject.outputSchema).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-schema-title">
              <Code className="w-5 h-5" />
              Output Schema
            </CardTitle>
            <CardDescription>Expected JSON structure for this API</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-48 text-sm font-mono" data-testid="text-output-schema">
              {JSON.stringify(selectedProject?.outputSchema || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
