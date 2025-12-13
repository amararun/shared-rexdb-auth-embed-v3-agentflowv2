import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate that it's a GitHub releases URL
  if (!url.includes('github.com') || !url.includes('/releases/download/')) {
    return res.status(400).json({ error: 'Invalid GitHub releases URL' });
  }

  try {
    console.log('[GitHub Proxy] Starting download:', {
      url,
      timestamp: new Date().toISOString()
    });

    // Fetch file from GitHub releases (GitHub returns 302 redirect to CDN)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow', // Follow redirects automatically
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/octet-stream'
      }
    });
    
    console.log('[GitHub Proxy] Fetch completed:', {
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url
    });

    console.log('[GitHub Proxy] Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('Content-Type'),
      contentLength: response.headers.get('Content-Length'),
      finalUrl: response.url
    });

    if (!response.ok) {
      console.error('[GitHub Proxy] HTTP error:', {
        status: response.status,
        statusText: response.statusText
      });
      return res.status(response.status).json({
        error: 'Failed to fetch from GitHub',
        status: response.status,
        statusText: response.statusText
      });
    }

    // Get the content
    const buffer = await response.arrayBuffer();
    const bufferSize = buffer.byteLength;
    
    // Check first bytes to detect file type
    const uint8Array = new Uint8Array(buffer);
    const firstBytes = Array.from(uint8Array.slice(0, 100)).map(b => String.fromCharCode(b)).join('');
    const isZIP = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // ZIP magic bytes: "PK"
    const isHTML = firstBytes.trim().toLowerCase().startsWith('<!doctype') || 
                   firstBytes.trim().toLowerCase().startsWith('<html') ||
                   firstBytes.includes('github') && firstBytes.includes('404');
    
    console.log('[GitHub Proxy] Buffer received:', {
      size: bufferSize,
      sizeKB: (bufferSize / 1024).toFixed(2),
      sizeMB: (bufferSize / (1024 * 1024)).toFixed(2),
      isZIP,
      isHTML,
      firstBytes: firstBytes.substring(0, 100)
    });

    // Check if we got HTML instead of a file (GitHub error page)
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html') || isHTML) {
      console.error('[GitHub Proxy] Received HTML instead of file:', {
        contentType,
        firstBytes: firstBytes.substring(0, 200),
        finalUrl: response.url
      });
      return res.status(400).json({
        error: 'Received HTML instead of file - GitHub access issue',
        hint: 'File may not exist or URL is incorrect',
        debug: {
          contentType,
          firstBytes: firstBytes.substring(0, 100),
          size: bufferSize,
          finalUrl: response.url
        }
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    res.setHeader('Content-Length', bufferSize.toString());

    console.log('[GitHub Proxy] Sending file to client:', {
      size: bufferSize,
      contentType: res.getHeader('Content-Type')
    });

    // Send the file
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('[GitHub Proxy] Error proxying GitHub file:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

