"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, Clock, CheckCircle, XCircle, Copy, Code, Eye, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PlaygroundData {
  session: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    viewCount: number;
    allowEditing: boolean;
    savedRequest: { method: string; headers: Record<string, string>; body: string } | null;
    savedResponse: { status: number; body: unknown; latencyMs: number; timestamp: string } | null;
    project: { name: string; slug: string };
    owner: { name: string; avatarUrl: string | null };
  };
  collaborators: Array<{
    id: string;
    role: string;
    lastActiveAt: string | null;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  history: Array<{
    id: string;
    request: { method: string; headers: Record<string, string>; body: string };
    response: { status: number; body: unknown; latencyMs: number } | null;
    error: string | null;
    createdAt: string;
  }>;
  canEdit: boolean;
}

interface PlaygroundResponse {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  latency: number;
  timestamp: string;
}

export default function SharedPlaygroundPage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);

  const { data, isLoading, error } = useQuery<PlaygroundData>({
    queryKey: ["/api/playground", "shareToken", token],
    queryFn: async () => {
      const res = await fetch(`/api/playground?shareToken=${token}`);
      if (!res.ok) throw new Error("Playground not found");
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (data?.session?.savedRequest) {
      setInputText(data.session.savedRequest.body || "");
    }
    if (data?.session?.savedResponse) {
      setResponse({
        success: data.session.savedResponse.status === 200,
        output: data.session.savedResponse.body as Record<string, unknown>,
        latency: data.session.savedResponse.latencyMs,
        timestamp: data.session.savedResponse.timestamp,
      });
    }
  }, [data]);

  const executeMutation = useMutation({
    mutationFn: async ({ shareToken, input }: { shareToken: string; input: string }) => {
      const startTime = Date.now();
      
      const res = await fetch("/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken, input }),
      });
      
      const resData = await res.json();
      const latency = Date.now() - startTime;
      
      return {
        ...resData,
        latency,
        timestamp: new Date().toISOString(),
      };
    },
    onSuccess: (resData) => {
      setResponse(resData);
    },
    onError: (err: Error) => {
      setResponse({
        success: false,
        error: err.message,
        latency: 0,
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleExecute = () => {
    if (!token || !inputText.trim()) {
      toast({
        title: "Missing input",
        description: "Please enter some input text.",
        variant: "destructive",
      });
      return;
    }
    
    executeMutation.mutate({ shareToken: token, input: inputText });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Playground Not Found</h2>
            <p className="text-muted-foreground">This playground may be private or no longer exists.</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, collaborators, history, canEdit } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-playground-name">{session.name}</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-project-name">{session.project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span data-testid="text-view-count">{session.viewCount} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.owner.avatarUrl || undefined} />
                <AvatarFallback>{session.owner.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-sm" data-testid="text-owner-name">{session.owner.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {session.description && (
          <p className="text-muted-foreground" data-testid="text-description">{session.description}</p>
        )}

        {collaborators.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {collaborators.slice(0, 5).map((collab) => (
                <Avatar key={collab.id} className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={collab.user.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">{collab.user.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            {collaborators.length > 5 && (
              <span className="text-sm text-muted-foreground">+{collaborators.length - 5} more</span>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-request-title">Request</CardTitle>
              <CardDescription>
                {canEdit ? "Test the API with your own input" : "View the saved request"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-textarea">Input</Label>
                <Textarea
                  id="input-textarea"
                  placeholder="Enter your input text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  disabled={!canEdit}
                  data-testid="input-text"
                />
              </div>

              {canEdit && (
                <Button
                  className="w-full gap-2 text-white"
                  style={{ background: "linear-gradient(135deg, #6B3A67, #D782B2, #425884)" }}
                  onClick={handleExecute}
                  disabled={!inputText.trim() || executeMutation.isPending}
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
              )}
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
                  </div>
                )}
              </CardTitle>
              <CardDescription>View the API response</CardDescription>
            </CardHeader>
            <CardContent>
              {!response ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground" data-testid="text-response-placeholder">
                  <p>{canEdit ? "Run a request to see the response" : "No saved response"}</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                    {new Date(response.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Request History
              </CardTitle>
              <CardDescription>Recent requests made in this playground</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.slice(0, 10).map((req) => (
                  <div key={req.id} className="p-3 bg-muted rounded-lg flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate">{req.request.body.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.response ? (
                        <Badge variant={req.response.status === 200 ? "secondary" : "destructive"} className="gap-1">
                          {req.response.status === 200 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {req.response.latencyMs}ms
                        </Badge>
                      ) : req.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
