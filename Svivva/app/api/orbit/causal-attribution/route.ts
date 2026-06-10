import { NextRequest, NextResponse } from "next/server";
import { openai, getDefaultModel, isOrbitFreeAIConfigured } from "@/lib/llm/openai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert in causal inference, econometrics, and marketing analytics.
You apply Judea Pearl's do-calculus, Directed Acyclic Graphs (DAGs), and information theory (transfer entropy, mutual information)
to determine TRUE causal effects of marketing channels — not mere correlations.

Given marketing channel data, outcomes, and potential confounders, you must:

1. **DAG Construction**: Build the causal graph. Identify which channels causally influence outcomes vs which are merely correlated due to confounders or colliders. Specify edge types: "causal" (direct causal link), "confounded" (spurious correlation via common cause), "mediated" (effect via mediator variable).

2. **Do-Calculus Application**: For each channel, compute P(outcome | do(channel=active)) vs P(outcome | do(channel=inactive)). The do-operator represents an actual intervention — forcing a variable to a value — which removes all incoming edges to that node in the DAG. This is the TRUE causal effect.

3. **Counterfactual Computation**: Estimate "If we had never run [channel], what would conversion rate be?" using the backdoor adjustment formula and the structural causal model.

4. **Transfer Entropy Analysis**: Estimate directional information flow between channels and outcomes. High transfer entropy from A→B means past values of A help predict B beyond B's own history. Identify "information sources" (channels that drive downstream behavior) vs "sinks" (channels that receive information from others).

5. **Confounder & Collider Identification**: Identify backdoor paths that bias correlational estimates. Identify colliders (variables that are common effects of two causes) — conditioning on colliders OPENS spurious paths and creates bias.

6. **Instrumental Variable Identification**: Find variables that affect the channel (treatment) but have no direct effect on outcome except through the channel. These enable causal identification even without full DAG knowledge.

7. **Optimal Allocation**: Given the estimated do-calculus effects and counterfactual ROIs, recommend budget reallocation.

You MUST respond with a valid JSON object matching this exact schema. All numeric fields must be numbers (not strings).

{
  "causalDAG": {
    "nodes": [{"id": string, "type": "channel" | "outcome" | "confounder" | "instrument"}],
    "edges": [{"from": string, "to": string, "type": "causal" | "confounded" | "mediated", "strength": number}],
    "confounders": string[],
    "colliders": string[]
  },
  "causalEffects": [
    {
      "channel": string,
      "doCalcEffect": number,
      "correlationalEffect": number,
      "biasAmount": number,
      "biasSource": string,
      "counterfactualImpact": string,
      "transferEntropy": number,
      "informationFlowDirection": "source" | "sink" | "neutral",
      "trueROI": number,
      "apparentROI": number,
      "confidence": number
    }
  ],
  "confounders": [
    {
      "name": string,
      "affectedChannels": string[],
      "biasDirection": "upward" | "downward",
      "magnitudeEstimate": string
    }
  ],
  "optimalAllocation": [
    {
      "channel": string,
      "currentSpend": number,
      "recommendedSpend": number,
      "causalJustification": string
    }
  ],
  "hiddenGemChannels": string[],
  "overratedChannels": string[],
  "keyInsight": string,
  "actionableRecommendations": string[]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channels, outcomes, confounders, analysisDepth } = body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ error: "At least one channel is required" }, { status: 400 });
    }

    if (!isOrbitFreeAIConfigured()) {
      return NextResponse.json(
        { error: "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or OLLAMA_URL." },
        { status: 503 },
      );
    }

    const maxTokens =
      analysisDepth === "production" ? 4000 : analysisDepth === "deep" ? 3000 : 2000;
    const temperature = analysisDepth === "quick" ? 0.3 : 0.2;

    const userContent = `
Marketing Channels:
${JSON.stringify(channels, null, 2)}

Outcomes:
${JSON.stringify(outcomes, null, 2)}

External Confounders to Account For:
${confounders && confounders.length > 0 ? confounders.join(", ") : "None specified"}

Analysis Depth: ${analysisDepth || "deep"}

Apply do-calculus, build the causal DAG, identify confounders and colliders, compute counterfactual impacts, measure transfer entropy, and recommend optimal budget allocation.
Return ONLY valid JSON matching the exact schema in your system prompt.`;

    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return NextResponse.json({ success: true, result, usedModel: getDefaultModel() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
