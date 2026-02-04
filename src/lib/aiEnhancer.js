// ============================================
// AI Answer Enhancer
// ============================================
// Takes template-generated answers and enhances them using Claude API.
// Supports two modes:
//   1. Direct: user provides their own API key (browser → Anthropic API)
//   2. Proxy:  requests go through a serverless function (api/enhance)

import { getSettings } from './store';

const SYSTEM_PROMPT = `You are an ESG response writer for a small/mid-sized supplier company.
You rewrite template-generated ESG questionnaire answers to sound natural, specific, and professional.

Rules:
- Keep the same factual content and data points — do not invent numbers
- Use the company name and industry naturally
- Sound like a sustainability manager wrote it, not a chatbot
- Be concise — most answers should be 2-4 sentences
- If data is missing or estimated, be honest about it with professional language
- Match the tone to the framework (EcoVadis wants narrative, CDP wants precision)
- Never use phrases like "As an AI" or "I'd be happy to" or "certainly"
- Never add data or claims not present in the original answer
- Return ONLY the rewritten answer, no preamble`;

/**
 * Enhance a single answer using AI.
 * @param {object} params
 * @param {string} params.questionText - The original question
 * @param {string} params.templateAnswer - The template-generated answer
 * @param {string} params.companyName - Company name for context
 * @param {string} params.industry - Industry sector
 * @param {string} params.framework - Framework (EcoVadis, CDP, etc.)
 * @param {string} params.questionType - POLICY, MEASURE, or KPI
 * @param {string} params.confidence - high, medium, low, none
 * @returns {Promise<{ enhanced: string, error?: string }>}
 */
export async function enhanceAnswer({
  questionText,
  templateAnswer,
  companyName,
  industry,
  framework,
  questionType,
  confidence,
}) {
  const settings = getSettings();
  const mode = settings.aiMode || 'proxy'; // 'direct' or 'proxy'
  const apiKey = settings.aiApiKey || '';
  const provider = settings.aiProvider || 'claude';

  if (mode === 'direct' && !apiKey) {
    return { enhanced: templateAnswer, error: 'No API key configured. Go to Settings → AI Enhancement.' };
  }

  const userMessage = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'General'}
Framework: ${framework || 'General ESG'}
Question type: ${questionType || 'Unknown'}
Data confidence: ${confidence || 'unknown'}

Question: ${questionText}

Template answer to rewrite:
${templateAnswer}`;

  try {
    if (mode === 'direct' && provider === 'claude') {
      return await callClaudeDirect(apiKey, userMessage);
    } else if (mode === 'direct' && provider === 'openai') {
      return await callOpenAIDirect(apiKey, userMessage);
    } else {
      return await callProxy(userMessage);
    }
  } catch (err) {
    return { enhanced: templateAnswer, error: err.message };
  }
}

/**
 * Enhance multiple answers in batch.
 * @param {Array} drafts - Answer draft objects
 * @param {object} companyData - Company context
 * @param {string} framework - Framework name
 * @param {function} onProgress - Called with (completed, total) after each answer
 * @returns {Promise<Map<string, string>>} - Map of questionId → enhanced answer
 */
export async function enhanceBatch(drafts, companyData, framework, onProgress) {
  const results = new Map();
  const total = drafts.length;

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];

    // Skip N/A, none-confidence, or already very short answers
    if (draft._markedNA || draft.answerConfidence === 'none') {
      results.set(draft.questionId, draft.answer);
      onProgress?.(i + 1, total);
      continue;
    }

    const result = await enhanceAnswer({
      questionText: draft.questionText,
      templateAnswer: draft.answer,
      companyName: companyData?.companyName,
      industry: companyData?.industry,
      framework,
      questionType: draft.questionType,
      confidence: draft.answerConfidence,
    });

    results.set(draft.questionId, result.enhanced);
    onProgress?.(i + 1, total);

    // Small delay between calls to avoid rate limiting
    if (i < drafts.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}

// --- Direct API calls (browser → API) ---

async function callClaudeDirect(apiKey, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${res.status}`);
  }

  const data = await res.json();
  const enhanced = data.content?.[0]?.text?.trim();
  if (!enhanced) throw new Error('Empty response from Claude');
  return { enhanced };
}

async function callOpenAIDirect(apiKey, userMessage) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const enhanced = data.choices?.[0]?.message?.content?.trim();
  if (!enhanced) throw new Error('Empty response from OpenAI');
  return { enhanced };
}

// --- Proxy mode (browser → serverless function → API) ---

async function callProxy(userMessage) {
  const res = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Proxy error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.enhanced) throw new Error('Empty response from proxy');
  return { enhanced: data.enhanced };
}
