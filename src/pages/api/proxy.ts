import { NextRequest, NextResponse } from 'next/server';
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
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.5; Windows 95)',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    
    // For non-HTML content, return directly
    if (!contentType.includes('text/html')) {
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // For HTML content, modify and inject our script
    const text = await response.text();
    
    const script = `
      <script>
        (function() {
          const baseUrl = '${url}';
          const base = document.createElement('base');
          base.href = baseUrl;
          document.head.prepend(base);

          function handleNavigation(targetUrl) {
            try {
              let absoluteUrl;
              if (targetUrl.startsWith('//')) {
                absoluteUrl = window.location.protocol + targetUrl;
              } else if (targetUrl.startsWith('/')) {
                const urlObj = new URL(baseUrl);
                absoluteUrl = urlObj.origin + targetUrl;
              } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                absoluteUrl = new URL(targetUrl, baseUrl).href;
              } else {
                absoluteUrl = targetUrl;
              }
              window.location.href = '/api/proxy?url=' + encodeURIComponent(absoluteUrl);
            } catch (e) {
              console.error('Failed to handle navigation:', e);
            }
          }

          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
              e.preventDefault();
              e.stopPropagation();
              const href = link.href || link.getAttribute('href');
              if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                handleNavigation(href);
              }
            }
          }, true);

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
        })();
      </script>
    `;

    // Function to convert URLs to absolute
    const getAbsoluteUrl = (path: string) => {
      try {
        if (path.startsWith('/')) {
          const urlObj = new URL(url);
          return urlObj.origin + path;
        }
        return new URL(path, url).href;
      } catch (e) {
        return path;
      }
    };

    // Modify relative URLs to absolute
    const modifiedHtml = text
      .replace(
        /(href|src|action)="((?!javascript:|mailto:|tel:|data:|#|blob:|https?:\/\/|\/\/).*?)"/g,
        (match: string, attr: string, path: string) => {
          if (!path) return match;
          return `${attr}="${getAbsoluteUrl(path)}"`;
        }
      )
      .replace('</head>', `${script}</head>`);

    return new NextResponse(modifiedHtml, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the webpage' },
      { status: 500 }
    );
  }
} 