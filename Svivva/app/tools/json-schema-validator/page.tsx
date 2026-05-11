"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Code2, ArrowRight, Loader2, Copy, Check } from "lucide-react";
import {
  TentpoleStickyBar,
  TentpoleBanner,
  TentpoleStepIndicator,
} from "@/app/components/tentpole-upgrade-cta";

const EXAMPLE_JSON = `{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "roles": ["admin", "user"]
}`;

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "email": { "type": "string", "format": "email" },
    "roles": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false
}`;

const INVALID_EXAMPLE = `{
  "name": "",
  "age": -5,
  "email": "not-an-email",
  "unknownField": true
}`;

interface ValidationError {
  path: string;
  keyword: string;
  message: string;
  schemaPath: string;
}
interface ValidationResult {
  valid?: boolean;
  errors?: ValidationError[];
  message?: string;
  parseError?: "json" | "schema";
  error?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function JsonSchemaValidatorPage() {
  const [json, setJson] = useState(EXAMPLE_JSON);
  const [schema, setSchema] = useState(EXAMPLE_SCHEMA);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tools/validate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json, schema }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  };

  const loadInvalid = () => setJson(INVALID_EXAMPLE);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f1117] to-[#1a2035] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Link href="/tools" className="hover:text-white/70 transition-colors">
                Free Tools
              </Link>
              <span>/</span>
              <span className="text-white/60">JSON Schema Validator</span>
            </div>
            <TentpoleStepIndicator
              step={0}
              total={2}
              currentLabel="Validate schema"
              nextLabel="Auto-validate in production"
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5BA8A0] flex items-center justify-center flex-shrink-0">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">JSON Schema Validator</h1>
              <p className="text-white/60 mt-1 text-lg">
                Validate any JSON against a JSON Schema (draft-07). Powered by Ajv — the fastest
                JavaScript validator. Free, no signup.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["JSON Schema draft-07", "Ajv powered", "All formats", "Deep errors"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">JSON to validate</label>
              <div className="flex gap-2">
                <button
                  onClick={loadInvalid}
                  className="text-xs px-2.5 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 transition-colors"
                >
                  Load invalid example
                </button>
                <CopyButton text={json} />
              </div>
            </div>
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full rounded-xl border-2 border-border bg-muted/20 px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#5BA8A0]/40 focus:border-[#5BA8A0]/60 resize-y"
              placeholder='{"key": "value"}'
              data-testid="input-json"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">JSON Schema</label>
              <CopyButton text={schema} />
            </div>
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full rounded-xl border-2 border-border bg-muted/20 px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#5BA8A0]/40 focus:border-[#5BA8A0]/60 resize-y"
              placeholder='{"type": "object"}'
              data-testid="input-schema"
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={validate}
            disabled={loading || !json.trim() || !schema.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "#5BA8A0" }}
            data-testid="btn-validate"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {loading ? "Validating…" : "Validate JSON"}
          </button>
          <button
            onClick={() => {
              setJson("");
              setSchema("");
              setResult(null);
            }}
            className="px-4 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-2xl border-2 p-5 space-y-3 ${
              result.valid
                ? "border-green-400/60 bg-green-50 dark:bg-green-950/20"
                : "border-red-400/60 bg-red-50 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <p
                className={`font-bold text-lg ${result.valid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
              >
                {result.valid ? "✓ Valid JSON" : result.message || result.error || "Invalid"}
              </p>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-red-200 dark:border-red-900 bg-background/80 px-4 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{err.message}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-mono">
                          <span>
                            path: <strong className="text-foreground">{err.path || "/"}</strong>
                          </span>
                          <span>
                            keyword: <strong className="text-foreground">{err.keyword}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <TentpoleBanner
          context={result ? "validated" : undefined}
          headline={
            result?.valid
              ? "Schema passed — now enforce this in production automatically"
              : "Stop validating manually. Svivva does this on every API call."
          }
          body="Svivva wraps your AI endpoint with your JSON Schema — every response is validated automatically, and if it fails, the AI self-repairs before your users ever see it. Zero validation failures, no extra code."
          ctaText="Auto-validate in production — free"
        />

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">About JSON Schema Validation</h2>
          {[
            {
              q: "What is JSON Schema?",
              a: "JSON Schema is a vocabulary for annotating and validating JSON documents. It lets you define the expected structure, types, required fields, and constraints for any JSON data.",
            },
            {
              q: "Which JSON Schema drafts are supported?",
              a: "This validator uses Ajv which fully supports JSON Schema Draft-07 (the most widely used draft), with partial support for Draft-2019-09 and Draft-2020-12.",
            },
            {
              q: "What formats are supported?",
              a: "All standard formats from ajv-formats: email, date, date-time, uri, ipv4, ipv6, uuid, hostname, byte, binary, password, regex, and more.",
            },
            {
              q: "How do I validate model responses automatically?",
              a: "Svivva lets you define a JSON Schema for your AI endpoint — every response is automatically validated, and if it fails, the AI auto-repairs the output before returning it to your users.",
            },
            {
              q: "Can I use additionalProperties: false?",
              a: "Yes — this is fully supported and is one of the most useful constraints: it rejects any JSON that contains keys not defined in your schema's 'properties'.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">More free developer tools:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link
              href="/tools/ai-api-cost-calculator"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground"
            >
              LLM cost calculator
            </Link>
            <Link
              href="/tools/prompt-forge"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground"
            >
              PromptForge
            </Link>
            <Link
              href="/tools"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground"
            >
              All Tools →
            </Link>
          </div>
        </div>
      </div>
      <TentpoleStickyBar
        toolName="json-schema-validator"
        triggerAfterMs={15000}
        savingsLine="You're validating manually — Svivva does this automatically on every production API call."
      />
    </div>
  );
}
