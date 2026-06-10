import { NextRequest, NextResponse } from "next/server";
import { openai, getDefaultModel, isOrbitFreeAIConfigured } from "@/lib/llm/openai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a world-class cryptographer specializing in post-quantum cryptography (PQC), zero-knowledge proofs, and threat modeling.
You have deep expertise in NIST PQC standards (CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+, FALCON), Groth16 ZK-SNARKs, lattice-based cryptography, and the LWE hardness assumption.

Given a system's current cryptographic stack and security requirements, you must:

1. **Quantum Vulnerability Assessment**: For each cryptographic primitive, apply:
   - Shor's algorithm analysis for RSA, ECC, DH (polynomial-time break with ~4000 logical qubits for RSA-2048)
   - Grover's algorithm analysis for symmetric keys (√-time speedup: AES-128 degrades to 64-bit effective, AES-256 to 128-bit)
   - Estimate years-to-break for each primitive at projected qubit scaling rates (current trajectory: fault-tolerant qubits doubling ~every 18 months)

2. **PQC Migration Map**: For each vulnerable primitive, recommend the NIST-standardized post-quantum replacement:
   - Key Encapsulation: Kyber-512/768/1024 (NIST Level 1/3/5)
   - Digital Signatures: CRYSTALS-Dilithium (compact), FALCON (even more compact), SPHINCS+ (hash-based, conservative)
   - Include exact key/signature sizes, performance benchmarks, and migration complexity

3. **ZK Proof Circuit Design**: For each plain-English ZK goal, design the arithmetic circuit:
   - Describe R1CS (Rank-1 Constraint System) constraints
   - List private witness variables and public inputs
   - Use Groth16 protocol (constant-size proof: 3 group elements = 192 bytes for BN128)
   - Estimate prover time, verifier time, circuit constraint count

4. **Homomorphic Encryption Assessment**: Determine if any system operations could be performed on encrypted data:
   - BFV/BGV for integer arithmetic
   - CKKS for approximate real number arithmetic
   - TFHE for fast boolean operations and comparison

5. **Crypto Agility Score** (1-10): How easily can algorithms be swapped without breaking the system? 10 = fully agile (algorithm negotiated at runtime), 1 = hardcoded everywhere.

6. **Threat-Timeline Matrix**: For each threat actor and future year, estimate probability of breaking each primitive.

You MUST respond with a valid JSON object matching this exact schema:

{
  "vulnerabilityAssessment": [
    {
      "primitive": string,
      "classicalSecurityBits": number,
      "quantumSecurityBits": number,
      "timeToBreakClassical": string,
      "timeToBreakQuantum2030": string,
      "algorithm": string,
      "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "pqcReplacements": [
    {
      "replaces": string,
      "replacement": string,
      "securityLevel": string,
      "keySize": string,
      "performance": string,
      "migrationComplexity": "Low" | "Medium" | "High",
      "implementationNote": string
    }
  ],
  "zkProofDesigns": [
    {
      "goal": string,
      "protocol": string,
      "circuitDescription": string,
      "witnessVariables": string[],
      "publicInputs": string[],
      "proverTime": string,
      "verifierTime": string,
      "proofSize": string,
      "implementation": string,
      "useCase": string
    }
  ],
  "homomorphicAssessment": {
    "feasible": boolean,
    "recommendedScheme": string,
    "operations": string[]
  },
  "cryptoAgilityScore": number,
  "migrationRoadmap": [
    {
      "phase": number,
      "timeline": string,
      "action": string,
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "threatTimeline": [
    {
      "year": number,
      "actor": string,
      "rsa2048BreakProbability": number
    }
  ],
  "overallPostQuantumScore": number
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentSystem, securityRequirements, zkProofGoals, threatModel } = body;

    if (!currentSystem || !currentSystem.description) {
      return NextResponse.json({ error: "currentSystem.description is required" }, { status: 400 });
    }

    if (!isOrbitFreeAIConfigured()) {
      return NextResponse.json(
        { error: "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or OLLAMA_URL." },
        { status: 503 },
      );
    }

    const userContent = `
Current System:
${JSON.stringify(currentSystem, null, 2)}

Security Requirements (plain English):
${securityRequirements && securityRequirements.length > 0 ? securityRequirements.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") : "None specified"}

Zero-Knowledge Proof Goals:
${zkProofGoals && zkProofGoals.length > 0 ? zkProofGoals.map((g: string, i: number) => `${i + 1}. ${g}`).join("\n") : "None specified"}

Threat Model:
${threatModel && threatModel.length > 0 ? threatModel.join(", ") : "classical"}

Perform a full post-quantum cryptographic assessment. Apply Shor's algorithm analysis to asymmetric primitives, Grover's analysis to symmetric ones. Design ZK circuits for each proof goal. Return ONLY valid JSON matching the exact schema in your system prompt.`;

    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 4000,
      temperature: 0.15,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return NextResponse.json({ success: true, result, usedModel: getDefaultModel() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
