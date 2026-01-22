import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';

// Load .env from backend directory (works regardless of cwd)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // 10 requests per window default
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Initialize Gemini client lazily (only when needed)
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-002',
    systemInstruction: `You are a world-class startup product strategist.

Take the user's raw idea and transform it into a clear, practical, well-scoped product plan.

You MUST return valid JSON and NOTHING else.

JSON SCHEMA:
{
  "title": "string",
  "short_description": "string",
  "problem": "string",
  "solution": "string",
  "core_features": ["string"],
  "mvp_scope": ["string"],
  "suggested_tech_stack": ["string"],
  "next_steps": ["string"]
}

RULES:
- Be concise but insightful
- Be realistic about MVP scope
- Avoid buzzwords
- Make it buildable by a small team
- Do not include markdown
- Do not include explanations
- Do not include code blocks
- Do not include extra text
- Output ONLY valid JSON`,
  });
}

// Validate JSON function
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Extract JSON from text (handles cases where response might have markdown code blocks)
function extractJSON(text) {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const jsonStr = codeBlockMatch[1].trim();
    if (isValidJSON(jsonStr)) {
      return JSON.parse(jsonStr);
    }
  }
  
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0];
    if (isValidJSON(jsonStr)) {
      return JSON.parse(jsonStr);
    }
  }
  
  // If no JSON found, try parsing the entire text
  if (isValidJSON(text.trim())) {
    return JSON.parse(text.trim());
  }
  
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableGeminiError(err) {
  const status = err?.status;
  return [429, 500, 502, 503, 504].includes(status);
}

async function generateWithRetry(model, payload, { retries = 4 } = {}) {
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(payload);
    } catch (err) {
      lastErr = err;

      if (!isRetryableGeminiError(err) || attempt === retries) {
        throw err;
      }

      // Exponential backoff + jitter
      const base = 500; // ms
      const backoff = base * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(backoff + jitter);
    }
  }

  throw lastErr;
}


// POST /api/refine endpoint
app.post('/api/refine', async (req, res) => {
  try {
    const { idea } = req.body;

    // Validate input
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a valid idea string',
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Gemini API key is not configured',
      });
    }

    const userPrompt = `Refine this product idea into a structured plan:\n\n${idea}`;

    // Initialize Gemini model and generate
    const model = getGeminiModel();
    const result = await generateWithRetry(model, {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200, // consider lowering a bit
        responseMimeType: 'application/json',
      },
    });
    

    const response = result.response;
    if (!response?.text) {
      console.error('Empty response from Gemini');
      return res.status(500).json({
        error: 'Service error',
        message: 'The service is temporarily unavailable. Please try again later.',
      });
    }

    const responseText = response.text().trim();

    // Extract and parse JSON
    let parsedData = extractJSON(responseText);

    // Fallback: try parsing directly if extraction failed
    if (!parsedData) {
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        return res.status(500).json({
          error: 'Processing error',
          message: 'Unable to process the response. Please try again later.',
        });
      }
    }

    // Validate required fields
    const requiredFields = [
      'title',
      'short_description',
      'problem',
      'solution',
      'core_features',
      'mvp_scope',
      'suggested_tech_stack',
      'next_steps',
    ];

    const missingFields = requiredFields.filter((field) => !parsedData[field]);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Parsed data:', JSON.stringify(parsedData, null, 2));
      return res.status(500).json({
        error: 'Processing error',
        message: 'The response format is incomplete. Please try again later.',
      });
    }

    // Validate array fields
    const arrayFields = [
      'core_features',
      'mvp_scope',
      'suggested_tech_stack',
      'next_steps',
    ];

    for (const field of arrayFields) {
      if (!Array.isArray(parsedData[field]) || parsedData[field].length === 0) {
        parsedData[field] = ['Not specified'];
      }
    }

    // Success response
    res.json(parsedData);
  } catch (error) {
    console.error('Error refining idea:', error);

    // Handle Gemini API fetch errors (HTTP errors from Google AI)
    if (error instanceof GoogleGenerativeAIFetchError) {
      const status = error.status && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
      
      // User-friendly error messages based on status codes
      let userMessage = 'The service is temporarily unavailable. Please try again later.';
      
      if (status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (status === 400) {
        userMessage = 'Invalid request. Please check your input and try again.';
      } else if (status === 401 || status === 403) {
        userMessage = 'Service authentication error. Please try again later.';
      } else if (status === 404) {
        userMessage = 'Service endpoint not found. Please try again later.';
      } else if (status >= 500) {
        userMessage = 'The service is experiencing issues. Please try again later.';
      }
      
      return res.status(status > 599 ? 500 : status).json({
        error: 'Service error',
        message: userMessage,
      });
    }

    // Handle other specific error types
    if (error?.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Service configuration issue. Please try again later.',
      });
    }

    // Generic error - always show user-friendly message
    console.error('Unexpected error:', error);
    res.status(500).json({
      error: 'Service error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
