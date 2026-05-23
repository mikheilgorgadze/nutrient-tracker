import { getClient } from './client';
import { FOOD_ANALYSIS_SYSTEM_PROMPT, NUTRITION_LABEL_SYSTEM_PROMPT } from './prompts';
import { ApiResponseError, ParseError } from './errors';
import type { FoodEstimate, LabelEstimate } from './schema';

const MODEL = 'claude-haiku-4-5-20251001';

const REQUIRED_KEYS: (keyof FoodEstimate)[] = [
  'name', 'serving_description', 'estimated_weight_g',
  'kcal', 'protein_g', 'carbs_g', 'fat_g', 'confidence',
];

function validateEstimate(obj: unknown): obj is FoodEstimate {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  for (const key of REQUIRED_KEYS) {
    if (!(key in o)) return false;
  }
  if (!['low', 'medium', 'high'].includes(o.confidence as string)) return false;
  return true;
}

/**
 * Analyzes a food photo and returns a macro estimate.
 *
 * @param base64Image  Base64-encoded JPEG image (no data URI prefix).
 * @throws ApiKeyMissingError  if API key is not configured.
 * @throws ApiResponseError    if the API returns a non-2xx status.
 * @throws ParseError          if the response JSON is malformed.
 */
export async function analyzeFood(base64Image: string): Promise<FoodEstimate> {
  const client = getClient(); // throws ApiKeyMissingError if key absent

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: FOOD_ANALYSIS_SYSTEM_PROMPT,
        // @ts-ignore — cache_control is valid in SDK but not yet reflected in all type defs
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Analyze this food photo and return the JSON estimate.',
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    throw new ParseError('Empty or unexpected response from Claude', '');
  }

  const raw = block.text.trim();
  let parsed: unknown;
  try {
    // Strip any accidental markdown fences
    const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ParseError(`Failed to parse Claude response as JSON`, raw);
  }

  if (!validateEstimate(parsed)) {
    throw new ParseError('Claude response missing required fields', raw);
  }

  return parsed;
}

const LABEL_REQUIRED_KEYS: (keyof LabelEstimate)[] = [
  'name', 'serving_label', 'serving_size_g',
  'kcal_per_serving', 'protein_g', 'carbs_g', 'fat_g',
];

function validateLabel(obj: unknown): obj is LabelEstimate {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  for (const key of LABEL_REQUIRED_KEYS) {
    if (!(key in o)) return false;
  }
  return true;
}

function parseJson(raw: string): unknown {
  const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new ParseError('Failed to parse Claude response as JSON', raw);
  }
}

/**
 * Reads a nutrition facts label photo and returns exact structured values.
 *
 * @param base64Image  Base64-encoded JPEG (no data URI prefix).
 */
export async function analyzeLabelPhoto(base64Image: string): Promise<LabelEstimate> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: NUTRITION_LABEL_SYSTEM_PROMPT,
        // @ts-ignore
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
          },
          { type: 'text', text: 'Read this nutrition facts label and return the JSON.' },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    throw new ParseError('Empty or unexpected response from Claude', '');
  }

  const parsed = parseJson(block.text.trim());

  if (!validateLabel(parsed)) {
    throw new ParseError('Label response missing required fields', block.text);
  }

  return parsed as LabelEstimate;
}
