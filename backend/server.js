import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client lazily (only when needed)
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'OpenAI API key is not configured',
      });
    }

    // System prompt that enforces strict JSON output
    const systemPrompt = `You are a world-class startup product strategist.

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
- Output ONLY valid JSON`;

    const userPrompt = `Refine this product idea into a structured plan:\n\n${idea}`;

    // Initialize OpenAI client
    const openai = getOpenAIClient();

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '';

    if (!responseText) {
      return res.status(500).json({
        error: 'OpenAI API error',
        message: 'Empty response from OpenAI',
      });
    }

    // Extract and parse JSON
    let parsedData = extractJSON(responseText);

    // Fallback: try parsing directly if extraction failed
    if (!parsedData) {
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        return res.status(500).json({
          error: 'JSON parsing error',
          message: 'Failed to parse OpenAI response as JSON',
          rawResponse: responseText.substring(0, 200),
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
      return res.status(500).json({
        error: 'Invalid response structure',
        message: `Missing required fields: ${missingFields.join(', ')}`,
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

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: 'OpenAI API error',
        message: error.message || 'Failed to process request',
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
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
