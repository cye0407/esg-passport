export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key, instance_name } = req.body || {};

  if (!license_key) {
    return res.status(400).json({ valid: false, error: 'Missing license_key' });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key, instance_name }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ valid: false, error: 'Could not reach license server' });
  }
}
