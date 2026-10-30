// Read-only relay to the Government of India Agmarknet feed, deployed on Vercel in the Mumbai region.
// data.gov.in refuses connections from the Render server in the USA; the Render server calls this relay
// instead. It only forwards GET requests to one fixed resource (Maharashtra mandi prices), so it cannot be
// used as an open proxy, and it never writes anything. The API key is sent by the Render server in a header.

const RESOURCE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Only GET is allowed' });
    return;
  }

  const apiKey = req.headers['x-data-gov-key'];
  if (!apiKey || !/^[0-9a-f]{20,80}$/i.test(String(apiKey))) {
    res.status(400).json({ error: 'Missing or invalid data.gov.in API key' });
    return;
  }

  const offset = Math.max(0, Math.min(parseInt(req.query.offset, 10) || 0, 20000));
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 1000, 1000));
  const params = new URLSearchParams({
    'api-key': String(apiKey),
    format: 'json',
    limit: String(limit),
    offset: String(offset),
    'filters[state.keyword]': 'Maharashtra'
  });

  try {
    const upstream = await fetch(`${RESOURCE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(25000)
    });
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({ error: `Could not reach data.gov.in from the relay: ${err.message}` });
  }
}
