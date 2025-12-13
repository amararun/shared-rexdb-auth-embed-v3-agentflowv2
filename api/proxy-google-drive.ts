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

  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Missing fileId parameter' });
  }

  try {
    // Google Drive direct download URL with confirmation to bypass virus scan warning
    const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
    
    console.log('[Google Drive Proxy] Starting download:', {
      fileId,
      url: googleDriveUrl,
      timestamp: new Date().toISOString()
    });

    // Fetch file from Google Drive
    const response = await fetch(googleDriveUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('[Google Drive Proxy] Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('Content-Type'),
      contentLength: response.headers.get('Content-Length'),
      finalUrl: response.url
    });

    if (!response.ok) {
      console.error('[Google Drive Proxy] HTTP error:', {
        status: response.status,
        statusText: response.statusText
      });
      return res.status(response.status).json({
        error: 'Failed to fetch from Google Drive',
        status: response.status,
        statusText: response.statusText
      });
    }

    // Get the content
    const buffer = await response.arrayBuffer();
    const bufferSize = buffer.byteLength;
    
    console.log('[Google Drive Proxy] Buffer received:', {
      size: bufferSize,
      sizeKB: (bufferSize / 1024).toFixed(2),
      sizeMB: (bufferSize / (1024 * 1024)).toFixed(2)
    });

    // Check first bytes to detect file type
    const uint8Array = new Uint8Array(buffer);
    const firstBytes = Array.from(uint8Array.slice(0, 100)).map(b => String.fromCharCode(b)).join('');
    const isZIP = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // ZIP magic bytes: "PK"
    const isHTML = firstBytes.trim().toLowerCase().startsWith('<!doctype') || 
                   firstBytes.trim().toLowerCase().startsWith('<html') ||
                   firstBytes.includes('Google Drive') ||
                   firstBytes.includes('virus scan');

    console.log('[Google Drive Proxy] Content analysis:', {
      firstBytes: firstBytes.substring(0, 50),
      isZIP,
      isHTML,
      contentType: response.headers.get('Content-Type')
    });

    // Check if we got HTML instead of a file (Google Drive virus scan warning page)
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html') || isHTML) {
      console.log('[Google Drive Proxy] Received HTML (likely virus scan warning), parsing for download link...');
      
      // Parse HTML to extract the actual download link
      const htmlText = Buffer.from(buffer).toString('utf-8');
      
      // Look for the download link in the HTML
      // Google Drive warning page usually has a form with action or a direct download link
      let downloadUrl: string | null = null;
      
      // Method 1: Look for form action with download URL
      const formActionMatch = htmlText.match(/<form[^>]*action="([^"]*download[^"]*)"/i);
      if (formActionMatch) {
        downloadUrl = formActionMatch[1];
        // Make it absolute if relative
        if (downloadUrl.startsWith('/')) {
          downloadUrl = 'https://drive.google.com' + downloadUrl;
        }
      }
      
      // Method 2: Look for direct download link in href
      if (!downloadUrl) {
        const hrefMatch = htmlText.match(/href="([^"]*uc\?[^"]*export=download[^"]*)"/i);
        if (hrefMatch) {
          downloadUrl = hrefMatch[1];
          if (downloadUrl.startsWith('/')) {
            downloadUrl = 'https://drive.google.com' + downloadUrl;
          }
        }
      }
      
      // Method 3: Look for usercontent.google.com download link
      if (!downloadUrl) {
        const userContentMatch = htmlText.match(/href="(https:\/\/drive\.usercontent\.google\.com\/[^"]*)"/i);
        if (userContentMatch) {
          downloadUrl = userContentMatch[1];
        }
      }
      
      // Method 4: Extract confirmation token and build download URL
      if (!downloadUrl) {
        // Look for confirmation token in the HTML (usually in a form or link)
        const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/i);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
          console.log('[Google Drive Proxy] Extracted confirmation token, building URL');
        }
      }
      
      // Method 5: Try to extract from JavaScript or data attributes
      if (!downloadUrl) {
        const jsMatch = htmlText.match(/downloadUrl["\s:=]+([^"'\s]+)/i);
        if (jsMatch) {
          downloadUrl = jsMatch[1];
        }
      }
      
      // Method 6: Try alternative URL pattern without confirmation
      if (!downloadUrl) {
        // Sometimes the direct usercontent URL works
        downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=&ts=`;
        console.log('[Google Drive Proxy] Trying alternative usercontent URL');
      }
      
      if (downloadUrl) {
        console.log('[Google Drive Proxy] Found download link in HTML, following:', downloadUrl);
        
        // Follow the extracted download link
        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!downloadResponse.ok) {
          console.error('[Google Drive Proxy] Failed to download from extracted link:', {
            status: downloadResponse.status,
            url: downloadUrl
          });
          return res.status(downloadResponse.status).json({
            error: 'Failed to download from extracted link',
            status: downloadResponse.status
          });
        }
        
        // Get the actual file content
        const fileBuffer = await downloadResponse.arrayBuffer();
        const fileSize = fileBuffer.byteLength;
        
        console.log('[Google Drive Proxy] File downloaded successfully:', {
          size: fileSize,
          sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
          contentType: downloadResponse.headers.get('Content-Type')
        });
        
        // Validate it's actually a file (not HTML again)
        const fileUint8Array = new Uint8Array(fileBuffer);
        const fileIsZIP = fileUint8Array[0] === 0x50 && fileUint8Array[1] === 0x4B;
        const fileFirstBytes = Array.from(fileUint8Array.slice(0, 100)).map(b => String.fromCharCode(b)).join('');
        const fileIsHTML = fileFirstBytes.trim().toLowerCase().startsWith('<!doctype') || 
                          fileFirstBytes.trim().toLowerCase().startsWith('<html');
        
        if (fileIsHTML) {
          console.error('[Google Drive Proxy] Still getting HTML after following link');
          return res.status(400).json({
            error: 'Unable to bypass Google Drive virus scan warning',
            hint: 'File may require manual download or different sharing settings'
          });
        }
        
        // Set appropriate headers
        res.setHeader('Content-Type', downloadResponse.headers.get('Content-Type') || 'application/octet-stream');
        res.setHeader('Content-Length', fileSize.toString());
        
        return res.status(200).send(Buffer.from(fileBuffer));
      } else {
        console.error('[Google Drive Proxy] Could not extract download link from HTML');
        return res.status(400).json({
          error: 'Received HTML but could not extract download link',
          hint: 'File may require manual download or different sharing settings',
          debug: {
            htmlPreview: htmlText.substring(0, 500)
          }
        });
      }
    }

    // Validate ZIP file if expected
    if (!isZIP && bufferSize > 0) {
      console.warn('[Google Drive Proxy] File does not appear to be a ZIP (missing PK header)');
    }

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    res.setHeader('Content-Length', bufferSize.toString());

    console.log('[Google Drive Proxy] Sending file to client:', {
      size: bufferSize,
      contentType: res.getHeader('Content-Type')
    });

    // Send the file
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('[Google Drive Proxy] Error proxying Google Drive file:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
