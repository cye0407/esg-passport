// LemonSqueezy /v1/licenses/deactivate is public (license_key authenticates)
// and requires a form-encoded body.
const ALLOWED_ORIGINS = new Set([
  'https://esgforsuppliers.com',
  'https://www.esgforsuppliers.com',
  'https://esg-passport-seven.vercel.app',
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key, instance_id } = req.body || {};

  if (!license_key || !instance_id) {
    return res.status(400).json({ error: 'Missing license_key or instance_id' });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ license_key, instance_id }).toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach license server' });
  }
}
