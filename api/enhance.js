// Vercel Serverless Function: AI Answer Enhancement Proxy
// Proxies requests to Claude API using server-side API key.
// Deploy with: ANTHROPIC_API_KEY env var set in Vercel dashboard.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI enhancement not configured on this server.' });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message field' });
  }

  // Basic rate limiting: reject very large payloads
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        system: `You are an ESG response writer for a small/mid-sized supplier company.
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
- Return ONLY the rewritten answer, no preamble`,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Claude API error: ${response.status}`,
      });
    }

    const data = await response.json();
    const enhanced = data.content?.[0]?.text?.trim();

    if (!enhanced) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    return res.status(200).json({ enhanced });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
