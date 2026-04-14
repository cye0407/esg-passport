export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key, instance_id } = req.body || {};
  const apiKey = process.env.LEMONSQUEEZY_API_KEY || process.env.LEMON_SQUEEZY_API_KEY || process.env.LS_API_KEY;

  if (!license_key || !instance_id) {
    return res.status(400).json({ error: 'Missing license_key or instance_id' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'License server not configured' });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ license_key, instance_id }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach license server' });
  }
}
