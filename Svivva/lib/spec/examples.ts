import type { ProjectSpec } from "./types";

export const sentimentAnalysisSpec: ProjectSpec = {
  version: "1.0",
  name: "Sentiment Analysis API",
  slug: "sentiment-analysis",
  description: "Analyzes text and returns sentiment classification with confidence scores",

  systemPrompt: `You are a sentiment analysis expert. Analyze the given text and determine its emotional tone.
Classify the sentiment as positive, negative, or neutral.
Provide a confidence score between 0 and 1.
Extract key phrases that influenced your decision.
Be objective and consider context, sarcasm, and nuance.`,

  endpoints: [
    {
      path: "/analyze",
      method: "POST",
      description: "Analyze sentiment of input text",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to analyze",
            minLength: 1,
            maxLength: 5000,
          },
          language: {
            type: "string",
            description: "Language code (e.g., 'en', 'es')",
            default: "en",
          },
        },
        required: ["text"],
      },
      outputSchema: {
        type: "object",
        properties: {
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"],
            description: "Overall sentiment classification",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Confidence score",
          },
          keyPhrases: {
            type: "array",
            items: { type: "string" },
            description: "Key phrases that influenced the sentiment",
          },
          emotions: {
            type: "object",
            properties: {
              joy: { type: "number", minimum: 0, maximum: 1 },
              sadness: { type: "number", minimum: 0, maximum: 1 },
              anger: { type: "number", minimum: 0, maximum: 1 },
              fear: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
        required: ["sentiment", "confidence", "keyPhrases"],
      },
    },
  ],

  examples: [
    {
      input: "I absolutely love this product! Best purchase I've ever made.",
      output: {
        sentiment: "positive",
        confidence: 0.95,
        keyPhrases: ["absolutely love", "best purchase", "ever made"],
        emotions: { joy: 0.9, sadness: 0.0, anger: 0.0, fear: 0.0 },
      },
      description: "Strongly positive review",
    },
    {
      input: "The service was terrible and I want a refund immediately.",
      output: {
        sentiment: "negative",
        confidence: 0.92,
        keyPhrases: ["terrible", "want a refund", "immediately"],
        emotions: { joy: 0.0, sadness: 0.2, anger: 0.8, fear: 0.0 },
      },
      description: "Negative complaint",
    },
  ],

  constraints: {
    maxTokens: 500,
    temperature: 0.3,
    responseFormat: "json",
    validationStrict: true,
    retryOnFailure: true,
    maxRetries: 3,
  },

  metadata: {
    author: "PromptAPI",
    tags: ["nlp", "sentiment", "text-analysis"],
    category: "Natural Language Processing",
    isPublic: true,
  },
};

export const productExtractorSpec: ProjectSpec = {
  version: "1.0",
  name: "Product Data Extractor",
  slug: "product-extractor",
  description: "Extracts structured product information from unstructured text descriptions",

  systemPrompt: `You are a product data extraction specialist. 
Extract structured product information from unstructured text.
Identify: product name, price, category, features, specifications.
Handle various formats and incomplete information gracefully.
Return null for fields that cannot be determined.`,

  endpoints: [
    {
      path: "/extract",
      method: "POST",
      description: "Extract product data from text",
      outputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Product name",
          },
          price: {
            type: "object",
            properties: {
              amount: { type: "number" },
              currency: { type: "string" },
            },
          },
          category: {
            type: "string",
            description: "Product category",
          },
          features: {
            type: "array",
            items: { type: "string" },
            description: "Key product features",
          },
          specifications: {
            type: "object",
            properties: {
              weight: { type: "string" },
              dimensions: { type: "string" },
              color: { type: "string" },
              material: { type: "string" },
            },
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
        },
        required: ["name", "confidence"],
      },
    },
  ],

  examples: [
    {
      input:
        "Apple MacBook Pro 16-inch, M3 Max chip, 36GB RAM, 1TB SSD. Price: $3,499. Space Black finish.",
      output: {
        name: "Apple MacBook Pro 16-inch",
        price: { amount: 3499, currency: "USD" },
        category: "Laptops",
        features: ["M3 Max chip", "36GB RAM", "1TB SSD", "Space Black finish"],
        specifications: {
          color: "Space Black",
        },
        confidence: 0.98,
      },
    },
  ],

  constraints: {
    maxTokens: 800,
    temperature: 0.2,
    responseFormat: "json",
    validationStrict: true,
    retryOnFailure: true,
    maxRetries: 3,
  },

  metadata: {
    tags: ["extraction", "e-commerce", "products"],
    category: "Data Extraction",
    isPublic: true,
  },
};

export const codeReviewerSpec: ProjectSpec = {
  version: "1.0",
  name: "Code Review Assistant",
  slug: "code-reviewer",
  description: "Reviews code snippets and provides feedback on quality, bugs, and improvements",

  systemPrompt: `You are an expert code reviewer with deep knowledge of software engineering best practices.
Review the provided code and identify:
- Potential bugs and errors
- Security vulnerabilities
- Performance issues
- Code style and readability improvements
- Best practice violations

Provide actionable, specific feedback with line numbers when applicable.
Rate the overall code quality from 1-10.`,

  endpoints: [
    {
      path: "/review",
      method: "POST",
      description: "Review a code snippet",
      parameters: [
        {
          name: "language",
          type: "string",
          description: "Programming language",
          required: true,
        },
      ],
      outputSchema: {
        type: "object",
        properties: {
          score: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Overall code quality score",
          },
          summary: {
            type: "string",
            description: "Brief summary of the review",
          },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: {
                  type: "string",
                  enum: ["critical", "major", "minor", "suggestion"],
                },
                type: {
                  type: "string",
                  enum: ["bug", "security", "performance", "style", "best-practice"],
                },
                line: { type: "integer" },
                message: { type: "string" },
                suggestion: { type: "string" },
              },
              required: ["severity", "type", "message"],
            },
          },
          improvements: {
            type: "array",
            items: { type: "string" },
            description: "Suggested improvements",
          },
        },
        required: ["score", "summary", "issues"],
      },
    },
  ],

  examples: [
    {
      input: `function getUser(id) {
  const user = db.query("SELECT * FROM users WHERE id = " + id);
  return user;
}`,
      output: {
        score: 3,
        summary:
          "Critical SQL injection vulnerability detected. Code lacks error handling and type safety.",
        issues: [
          {
            severity: "critical",
            type: "security",
            line: 2,
            message: "SQL injection vulnerability: user input is concatenated directly into query",
            suggestion:
              "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [id])",
          },
          {
            severity: "major",
            type: "bug",
            message: "No error handling for database query failure",
            suggestion: "Wrap in try-catch and handle potential errors",
          },
        ],
        improvements: [
          "Add input validation for the id parameter",
          "Add TypeScript types for better type safety",
          "Consider using an ORM for database operations",
        ],
      },
    },
  ],

  constraints: {
    maxTokens: 1500,
    temperature: 0.4,
    responseFormat: "json",
    validationStrict: true,
    retryOnFailure: true,
    maxRetries: 3,
  },

  metadata: {
    tags: ["code-review", "developer-tools", "security"],
    category: "Developer Tools",
    isPublic: true,
  },
};

export const exampleSpecs = {
  sentimentAnalysis: sentimentAnalysisSpec,
  productExtractor: productExtractorSpec,
  codeReviewer: codeReviewerSpec,
};
