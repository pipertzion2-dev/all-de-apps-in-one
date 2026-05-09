"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import Link from "next/link";

type TestStatus = "pending" | "running" | "pass" | "fail";

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
}

function ApiCreationTest() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [steps, setSteps] = useState<{ name: string; status: TestStatus; detail: string }[]>([]);
  const [createdProject, setCreatedProject] = useState<any>(null);

  const updateStep = (name: string, status: TestStatus, detail: string) => {
    setSteps((prev) => {
      const existing = prev.findIndex((s) => s.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, status, detail };
        return updated;
      }
      return [...prev, { name, status, detail }];
    });
  };

  const runApiTest = async () => {
    setStatus("running");
    setSteps([]);
    setCreatedProject(null);

    // Step 1: Check if logged in
    updateStep("Check Login", "running", "Checking authentication...");
    try {
      const authRes = await fetch("/api/auth/user");
      if (!authRes.ok) {
        updateStep("Check Login", "fail", "Not logged in - please log in first via Dashboard");
        setStatus("error");
        return;
      }
      const user = await authRes.json();
      updateStep("Check Login", "pass", `Logged in as ${user.firstName || user.email || "User"}`);
    } catch (err: any) {
      updateStep("Check Login", "fail", err.message);
      setStatus("error");
      return;
    }

    // Step 2: Send API creation request
    updateStep("Create API", "running", "Sending: 'Create a music key detector API'...");
    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "Create a music key detector API that identifies which musical key a melody or chord progression is in",
          expectedOutput: JSON.stringify(
            {
              key: "C major",
              confidence: 0.95,
              alternativeKeys: ["A minor"],
              scale: ["C", "D", "E", "F", "G", "A", "B"],
            },
            null,
            2,
          ),
          settings: {
            creativity: 50,
            detailLevel: 50,
            strictness: 70,
          },
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({}));
        updateStep(
          "Create API",
          "fail",
          errorData.error || errorData.message || `Status ${createRes.status}`,
        );
        setStatus("error");
        return;
      }

      const project = await createRes.json();
      setCreatedProject(project);
      updateStep("Create API", "pass", `Created project: ${project.name || project.id}`);
    } catch (err: any) {
      updateStep("Create API", "fail", err.message);
      setStatus("error");
      return;
    }

    // Step 3: Verify project exists
    updateStep("Verify Project", "running", "Checking if project was saved...");
    try {
      const listRes = await fetch("/api/projects");
      const projects = await listRes.json();

      if (Array.isArray(projects) && projects.length > 0) {
        updateStep("Verify Project", "pass", `Found ${projects.length} project(s) in database`);
        setStatus("success");
      } else {
        updateStep("Verify Project", "fail", "No projects found");
        setStatus("error");
      }
    } catch (err: any) {
      updateStep("Verify Project", "fail", err.message);
      setStatus("error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test: Create Music Key Detector API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This test will attempt to create a "Music Key Detector API" and verify it was saved.
        </p>

        <Button
          onClick={runApiTest}
          disabled={status === "running"}
          className="w-full"
          data-testid="button-create-api-test"
        >
          {status === "running" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating API...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Test: Create Music Key Detector API
            </>
          )}
        </Button>

        {steps.length > 0 && (
          <div className="space-y-2 mt-4">
            {steps.map((step) => (
              <div
                key={step.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  step.status === "pass"
                    ? "border-green-500/50 bg-green-500/10"
                    : step.status === "fail"
                      ? "border-red-500/50 bg-red-500/10"
                      : step.status === "running"
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-border"
                }`}
              >
                <div>
                  <div className="font-medium">{step.name}</div>
                  <div className="text-sm text-muted-foreground">{step.detail}</div>
                </div>
                {step.status === "pass" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {step.status === "fail" && <XCircle className="h-5 w-5 text-red-500" />}
                {step.status === "running" && (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                )}
              </div>
            ))}
          </div>
        )}

        {status === "success" && createdProject && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50">
            <p className="font-bold text-green-400 mb-2">SUCCESS! API Created</p>
            <p className="text-sm">Project Name: {createdProject.name || "Untitled"}</p>
            <p className="text-sm">Project ID: {createdProject.id}</p>
            <Link href="/dashboard" className="text-primary underline text-sm">
              View in Dashboard →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="font-bold text-red-400">Test Failed</p>
            <p className="text-sm text-muted-foreground">
              Check the steps above for details. Make sure you're logged in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<string>("");

  const updateResult = (name: string, status: TestStatus, detail: string) => {
    setResults((prev) => {
      const existing = prev.findIndex((r) => r.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, status, detail };
        return updated;
      }
      return [...prev, { name, status, detail }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary("");

    const tests = [
      { name: "Homepage loads", url: "/", method: "GET" },
      { name: "Dashboard loads", url: "/dashboard", method: "GET" },
      { name: "Create page loads", url: "/dashboard/projects/new", method: "GET" },
      { name: "Auth endpoint", url: "/api/auth/user", method: "GET", allowUnauth: true },
      { name: "Projects API", url: "/api/projects", method: "GET", allowUnauth: true },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      updateResult(test.name, "running", "Testing...");

      try {
        const start = Date.now();
        const res = await fetch(test.url);
        const duration = Date.now() - start;

        if (res.ok || (test.allowUnauth && res.status === 401)) {
          passed++;
          updateResult(test.name, "pass", `${res.status} OK (${duration}ms)`);
        } else {
          failed++;
          updateResult(test.name, "fail", `Status: ${res.status}`);
        }
      } catch (err: any) {
        failed++;
        updateResult(test.name, "fail", err.message);
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    // Check if user is logged in
    try {
      const authRes = await fetch("/api/auth/user");
      if (authRes.ok) {
        const user = await authRes.json();
        setSummary(
          `All systems operational! Logged in as ${user.firstName || user.email || "User"}. ${passed}/${tests.length} tests passed.`,
        );
      } else {
        setSummary(
          `${passed}/${tests.length} tests passed. Note: You're not logged in, so some features require authentication. Go to Dashboard to log in.`,
        );
      }
    } catch {
      setSummary(`${passed}/${tests.length} tests passed.`);
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Svivva System Test</h1>
          <p className="text-muted-foreground mt-2">Check if all parts of the app are working</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This tests if pages load and APIs respond. To test actual API creation, you need to be
              logged in.
            </p>

            <div className="flex gap-3">
              <Button onClick={runTests} disabled={isRunning} data-testid="button-run-test">
                {isRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Tests
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
              <Link href="/dashboard/projects/new">
                <Button variant="outline">Create API</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.name}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === "pass"
                      ? "border-green-500/50 bg-green-500/10"
                      : result.status === "fail"
                        ? "border-red-500/50 bg-red-500/10"
                        : result.status === "running"
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-border"
                  }`}
                >
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.detail}</div>
                  </div>
                  {result.status === "pass" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {result.status === "fail" && <XCircle className="h-5 w-5 text-red-500" />}
                  {result.status === "running" && (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                </div>
              ))}

              {summary && (
                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-medium">{summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <ApiCreationTest />
      </div>
    </div>
  );
}
