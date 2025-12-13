import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin } from 'vite'
import * as dotenv from 'dotenv'

// Load ALL env vars (including non-VITE_ prefixed) for server-side middleware
dotenv.config()

// Debug: Log if Neon proxy env vars are loaded (only during dev)
console.log('[Vite Config] NEON_PROXY_URL loaded:', !!process.env.NEON_PROXY_URL)
console.log('[Vite Config] NEON_PROXY_API_KEY loaded:', !!process.env.NEON_PROXY_API_KEY)

// Custom plugin to proxy Neon DB creation (keeps API key secret)
function neonDbProxy(): Plugin {
  return {
    name: 'neon-db-proxy',
    configureServer(server) {
      server.middlewares.use('/api/create-neon-db', async (req, res, next) => {
        // Only handle POST requests
        if (req.method !== 'POST') {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.statusCode = 200;
            res.end();
            return;
          }
          next();
          return;
        }

        try {
          // Read environment variables (server-side only, not VITE_ prefixed)
          const NEON_PROXY_URL = process.env.NEON_PROXY_URL;
          const NEON_PROXY_API_KEY = process.env.NEON_PROXY_API_KEY;

          if (!NEON_PROXY_URL || !NEON_PROXY_API_KEY) {
            console.error('[Vite Neon Proxy] Missing env vars. Set NEON_PROXY_URL and NEON_PROXY_API_KEY in .env');
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Server config error: Missing NEON_PROXY_URL or NEON_PROXY_API_KEY' }));
            return;
          }

          // Parse request body
          let body = '';
          for await (const chunk of req) {
            body += chunk;
          }
          const jsonBody = JSON.parse(body);

          console.log('[Vite Neon Proxy] Forwarding to FastAPI:', NEON_PROXY_URL);

          // Forward to FastAPI with Authorization header
          const response = await fetch(`${NEON_PROXY_URL}/api/create-neon-db`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${NEON_PROXY_API_KEY}`
            },
            body: JSON.stringify(jsonBody)
          });

          const responseData = await response.json();

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = response.status;
          res.end(JSON.stringify(responseData));
        } catch (error) {
          console.error('[Vite Neon Proxy] Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
        }
      });
    }
  };
}

// Custom plugin to proxy GitHub releases (handles redirects server-side)
function githubReleaseProxy(): Plugin {
  return {
    name: 'github-release-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy-github-release', async (req, res, next) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const githubUrl = url.searchParams.get('url');
          
          if (!githubUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          console.log('[Vite Proxy] Fetching from GitHub:', githubUrl);
          
          // Fetch from GitHub (follows redirects server-side)
          const response = await fetch(githubUrl, {
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Failed to fetch: ${response.statusText}`);
            return;
          }

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
          res.setHeader('Content-Length', response.headers.get('Content-Length') || '');

          console.log('[Vite Proxy] Streaming file, size:', response.headers.get('Content-Length'));

          // Stream the response
          const reader = response.body?.getReader();
          if (!reader) {
            res.statusCode = 500;
            res.end('No response body');
            return;
          }

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            } catch (error) {
              console.error('[Vite Proxy] Stream error:', error);
              res.statusCode = 500;
              res.end('Stream error');
            }
          };

          pump();
        } catch (error) {
          console.error('[Vite Proxy] Error:', error);
          res.statusCode = 500;
          res.end(`Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), neonDbProxy(), githubReleaseProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['ag-grid-react', 'ag-grid-community']
  },
  envDir: './',
  define: {
    __ENV__: JSON.stringify(process.env)
  },
  // Strip console/debugger in production bundles only
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
  // Server config - default to port 5199
  server: {
    port: 5199,
    strictPort: false
  }
}))
