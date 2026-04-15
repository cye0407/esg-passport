// LemonSqueezy license endpoints are public (license_key authenticates),
// require form-encoded bodies, and split activation from validation:
//   /v1/licenses/activate  — first use, creates an instance from instance_name
//   /v1/licenses/validate  — subsequent checks, takes the existing instance_id
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

  const { license_key, instance_name, instance_id } = req.body || {};

  if (!license_key) {
    return res.status(400).json({ valid: false, error: 'Missing license_key' });
  }
  if (!instance_id && !instance_name) {
    return res.status(400).json({ valid: false, error: 'Missing instance_id or instance_name' });
  }

  const isActivation = !instance_id;
  const endpoint = isActivation
    ? 'https://api.lemonsqueezy.com/v1/licenses/activate'
    : 'https://api.lemonsqueezy.com/v1/licenses/validate';

  const params = new URLSearchParams({ license_key });
  if (isActivation) params.set('instance_name', instance_name);
  else params.set('instance_id', instance_id);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ valid: false, error: 'Could not reach license server' });
  }
}
