import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SummarizeTextBody,
  TranslateTextBody,
  ExplainCodeBody,
  CheckGrammarBody,
  AnalyzeSentimentBody,
  ExtractKeywordsBody,
  RewriteToneBody,
  GenerateQuizBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function sseHeaders(res: any) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

async function streamCompletion(res: any, systemPrompt: string, userPrompt: string) {
  sseHeaders(res);
  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

router.post("/summarize", async (req, res) => {
  const body = SummarizeTextBody.parse(req.body);
  const lengthGuide = body.length === "short" ? "1-2 sentences" : body.length === "long" ? "4-6 sentences" : "2-3 sentences";
  await streamCompletion(
    res,
    `You are an expert summarizer. Summarize the given text in ${lengthGuide}. Be concise and capture the main points.`,
    body.text
  );
});

router.post("/translate", async (req, res) => {
  const body = TranslateTextBody.parse(req.body);
  await streamCompletion(
    res,
    `You are a professional translator. Translate the following text to ${body.targetLanguage}. Only output the translation, nothing else.`,
    body.text
  );
});

router.post("/code-explain", async (req, res) => {
  const body = ExplainCodeBody.parse(req.body);
  const lang = body.language ? `${body.language} ` : "";
  await streamCompletion(
    res,
    `You are an expert software developer and teacher. Explain the following ${lang}code clearly and concisely. Describe what it does, how it works, and any important patterns or concepts used. Use plain language that a junior developer can understand.`,
    body.code
  );
});

router.post("/grammar", async (req, res) => {
  const body = CheckGrammarBody.parse(req.body);
  await streamCompletion(
    res,
    `You are a professional grammar checker and writing coach. Check the following text for grammar, spelling, punctuation, and style issues. First provide the corrected version of the text, then list the key corrections made with brief explanations. Format your response as:

CORRECTED TEXT:
[corrected version here]

CORRECTIONS MADE:
[list of corrections]`,
    body.text
  );
});

router.post("/sentiment", async (req, res) => {
  const body = AnalyzeSentimentBody.parse(req.body);
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with a JSON object (no markdown, just raw JSON) with these fields:
- sentiment: one of "positive", "negative", "neutral", or "mixed"
- score: a number between -1.0 (very negative) and 1.0 (very positive)
- explanation: a brief 1-2 sentence explanation of the sentiment
- emotions: an array of up to 5 specific emotions detected (e.g. "joy", "frustration", "hope", "anger", "excitement")`,
      },
      { role: "user", content: body.text },
    ],
    stream: false,
  });
  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch {
    res.json({ sentiment: "neutral", score: 0, explanation: "Unable to analyze sentiment.", emotions: [] });
  }
});

router.post("/keywords", async (req, res) => {
  const body = ExtractKeywordsBody.parse(req.body);
  const count = body.count ?? 10;
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are a keyword extraction expert. Extract the ${count} most important keywords or key phrases from the given text. Respond with a JSON object (no markdown, just raw JSON) with this format:
{ "keywords": [{ "word": "keyword", "relevance": 0.95 }, ...] }
Relevance is a number between 0 and 1 indicating how important/relevant the keyword is to the text.`,
      },
      { role: "user", content: body.text },
    ],
    stream: false,
  });
  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch {
    res.json({ keywords: [] });
  }
});

router.post("/tone-rewrite", async (req, res) => {
  const body = RewriteToneBody.parse(req.body);
  await streamCompletion(
    res,
    `You are an expert writing coach. Rewrite the following text in a ${body.tone} tone while preserving the original meaning and key information. Only output the rewritten text, nothing else.`,
    body.text
  );
});

router.post("/quiz", async (req, res) => {
  const body = GenerateQuizBody.parse(req.body);
  const count = body.count ?? 5;
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are an expert educator. Generate ${count} multiple-choice quiz questions based on the given text. Respond with a JSON object (no markdown, just raw JSON) in this exact format:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why the answer is correct"
    }
  ]
}
correctAnswer is the 0-based index of the correct option. Always provide exactly 4 options per question.`,
      },
      { role: "user", content: body.text },
    ],
    stream: false,
  });
  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch {
    res.json({ questions: [] });
  }
});

export default router;
