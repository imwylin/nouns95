import type { NextApiRequest, NextApiResponse } from 'next';
import fetch, { Response } from 'node-fetch';
import { parse as parseUrl } from 'url';
import { Readable } from 'stream';

// Headers that we want to forward from the original response
const ALLOWED_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'expires',
  'pragma',
  'etag',
  'last-modified',
  'content-encoding',
  'content-language',
  'content-disposition',
] as const;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle raw body ourselves
    responseLimit: false, // Remove response size limit
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function proxyRequest(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Parse the target URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.protocol || !parsedUrl.host) {
      throw new Error('Invalid URL');
    }

    // Prepare headers for the proxy request
    const headers: { [key: string]: string } = {
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.5; Windows 95)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Forward relevant headers from the original request
    if (req.headers.cookie) headers.cookie = req.headers.cookie as string;
    if (req.headers.referer) headers.referer = req.headers.referer;
    if (req.headers['accept-encoding']) headers['accept-encoding'] = req.headers['accept-encoding'] as string;

    // Get the request body for POST/PUT requests
    const method = req.method || 'GET';
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await getRawBody(req) : undefined;

    // Make the request to the target URL
    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'follow',
    });

    // Set response headers
    ALLOWED_HEADERS.forEach(header => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle HTML content specially to inject our navigation script
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const text = await response.text();
      
      // Inject our script for handling navigation
      const script = `
        <script>
          (function() {
            const baseUrl = '${url}';
            const base = document.createElement('base');
            base.href = baseUrl;
            document.head.prepend(base);

            function handleNavigation(targetUrl) {
              try {
                // Handle different URL formats
                let absoluteUrl;
                if (targetUrl.startsWith('//')) {
                  // Protocol-relative URL
                  absoluteUrl = window.location.protocol + targetUrl;
                } else if (targetUrl.startsWith('/')) {
                  // Root-relative URL
                  const urlObj = new URL(baseUrl);
                  absoluteUrl = urlObj.origin + targetUrl;
                } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                  // Relative URL
                  absoluteUrl = new URL(targetUrl, baseUrl).href;
                } else {
                  // Absolute URL
                  absoluteUrl = targetUrl;
                }
                window.parent.postMessage({ type: 'navigation', url: absoluteUrl }, '*');
              } catch (e) {
                console.error('Failed to handle navigation:', e);
              }
            }

            // Intercept all link clicks
            document.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              if (link) {
                e.preventDefault();
                e.stopPropagation();
                
                // Handle different types of hrefs
                const href = link.href || link.getAttribute('href');
                if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                  handleNavigation(href);
                }
              }
            }, true);

            // Handle form submissions
            document.addEventListener('submit', (e) => {
              e.preventDefault();
              const form = e.target;
              const method = (form.method || 'get').toLowerCase();
              
              if (method === 'get') {
                const formData = new FormData(form);
                const queryString = new URLSearchParams(formData).toString();
                const actionUrl = form.action || baseUrl;
                const targetUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + queryString;
                handleNavigation(targetUrl);
              }
            }, true);

            // Override window.location methods
            const originalLocation = window.location.href;
            Object.defineProperty(window.location, 'href', {
              get: function() { return originalLocation; },
              set: function(url) { handleNavigation(url); return true; }
            });

            window.location.assign = function(url) { handleNavigation(url); };
            window.location.replace = function(url) { handleNavigation(url); };
          })();
        </script>
      `;

      // Modify relative URLs to absolute ones
      const modifiedHtml = text
        .replace(
          /(href|src|action)="(?!javascript:|mailto:|tel:|data:|#|\/\/|https?:\/\/)(.*?)"/g,
          (match: string, attr: string, path: string) => {
            try {
              // Handle root-relative URLs
              if (path.startsWith('/')) {
                const urlObj = new URL(url);
                return `${attr}="${urlObj.origin}${path}"`;
              }
              // Handle relative URLs
              const absoluteUrl = new URL(path, url).href;
              return `${attr}="${absoluteUrl}"`;
            } catch (e) {
              return match;
            }
          }
        )
        .replace('</head>', `${script}</head>`);

      res.status(response.status).send(modifiedHtml);
    } else {
      // For non-HTML content, stream the response directly
      res.status(response.status);
      const buffer = await response.buffer();
      const readable = new Readable();
      readable._read = () => {}; // _read is required but we don't need to implement it
      readable.push(buffer);
      readable.push(null);
      readable.pipe(res);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch the webpage' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    // Handle preflight requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  return proxyRequest(req, res);
} 