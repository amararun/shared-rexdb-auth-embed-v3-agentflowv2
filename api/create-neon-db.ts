import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get server-side environment variables (NOT exposed to client)
  const NEON_PROXY_URL = process.env.NEON_PROXY_URL;
  const NEON_PROXY_API_KEY = process.env.NEON_PROXY_API_KEY;

  if (!NEON_PROXY_URL || !NEON_PROXY_API_KEY) {
    console.error('[Neon DB Proxy] Missing environment variables:', {
      hasUrl: !!NEON_PROXY_URL,
      hasApiKey: !!NEON_PROXY_API_KEY
    });
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing NEON_PROXY_URL or NEON_PROXY_API_KEY environment variables'
    });
  }

  try {
    const body = req.body;

    console.log('[Neon DB Proxy] Forwarding request to FastAPI:', {
      targetUrl: `${NEON_PROXY_URL}/api/create-neon-db`,
      projectName: body?.project?.name,
      timestamp: new Date().toISOString()
    });

    // Forward request to FastAPI backend with Authorization header
    const response = await fetch(`${NEON_PROXY_URL}/api/create-neon-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEON_PROXY_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const responseData = await response.json();

    console.log('[Neon DB Proxy] Response from FastAPI:', {
      status: response.status,
      statusText: response.statusText,
      hasHostname: !!responseData.hostname,
      hasDatabaseName: !!responseData.database_name
    });

    if (!response.ok) {
      console.error('[Neon DB Proxy] FastAPI error:', {
        status: response.status,
        error: responseData
      });
      return res.status(response.status).json(responseData);
    }

    // Return the database credentials to the frontend
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('[Neon DB Proxy] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
