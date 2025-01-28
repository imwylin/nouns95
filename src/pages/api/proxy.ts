import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

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
    
    // For non-HTML content, return directly with CORS headers
    if (!contentType.includes('text/html')) {
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // For HTML content, modify and inject our script
    const text = await response.text();
    
    const script = `
      <script>
        (function() {
          console.log('IE Script initialized');
          const baseUrl = '${url}';

          function handleNavigation(targetUrl) {
            try {
              const absoluteUrl = new URL(targetUrl, baseUrl).href;
              const proxyUrl = '/api/proxy?url=' + encodeURIComponent(absoluteUrl);
              console.log('Navigating to:', proxyUrl);
              
              // Send message to parent window to handle navigation
              window.parent.postMessage({
                type: 'navigate',
                url: absoluteUrl
              }, '*');
            } catch (err) {
              console.error('Navigation error:', err);
            }
          }

          function handleClick(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || 
                href.startsWith('tel:') || href.startsWith('#')) {
              return;
            }

            e.preventDefault();
            console.log('Handling click for URL:', href);
            handleNavigation(href);
          }

          // Add click handler to document
          document.addEventListener('click', handleClick, true);

          // Handle form submissions
          document.addEventListener('submit', function(e) {
            const form = e.target;
            if (!form || form.tagName.toLowerCase() !== 'form') return;
            
            const method = (form.method || 'get').toLowerCase();
            if (method === 'get') {
              e.preventDefault();
              console.log('Handling form submission');
              
              const formData = new FormData(form);
              const queryString = new URLSearchParams(formData).toString();
              const actionUrl = form.action || baseUrl;
              const targetUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + queryString;
              handleNavigation(targetUrl);
            }
          }, true);

          // Proxy all resource requests
          const originalFetch = window.fetch;
          window.fetch = function(input, init) {
            try {
              const url = input instanceof Request ? input.url : input;
              const absoluteUrl = new URL(url, baseUrl).href;
              const proxyUrl = '/api/proxy?url=' + encodeURIComponent(absoluteUrl);
              const newInput = input instanceof Request ? new Request(proxyUrl, input) : proxyUrl;
              return originalFetch(newInput, init);
            } catch (e) {
              return originalFetch(input, init);
            }
          };

          // Override XMLHttpRequest
          const XHR = XMLHttpRequest.prototype;
          const originalOpen = XHR.open;
          XHR.open = function(method, url, ...args) {
            try {
              const absoluteUrl = new URL(url, baseUrl).href;
              const proxyUrl = '/api/proxy?url=' + encodeURIComponent(absoluteUrl);
              return originalOpen.call(this, method, proxyUrl, ...args);
            } catch (e) {
              return originalOpen.call(this, method, url, ...args);
            }
          };

          console.log('IE Script setup complete');
        })();
      </script>
    `;

    // Process the HTML content
    let modifiedHtml = text;

    // Remove existing base tags and CSP meta tags
    modifiedHtml = modifiedHtml.replace(/<base[^>]*>/gi, '');
    modifiedHtml = modifiedHtml.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

    // Add our base tag and meta tags
    const headContent = `
      <base href="${url}">
      <meta name="referrer" content="no-referrer">
      <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
      ${script}
    `;

    // Insert head content
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${headContent}</head>`);
    } else if (modifiedHtml.includes('<body')) {
      modifiedHtml = modifiedHtml.replace('<body', `<head>${headContent}</head><body`);
    } else {
      modifiedHtml = `<head>${headContent}</head>${modifiedHtml}`;
    }

    // Convert relative URLs to absolute for resources
    modifiedHtml = modifiedHtml.replace(
      /(src|href|action)="(?!javascript:|data:|#|blob:|https?:\/\/|\/\/)(.*?)"/gi,
      (match, attr, path) => {
        if (!path) return match;
        try {
          const absoluteUrl = new URL(path, url).href;
          return `${attr}="${absoluteUrl}"`;
        } catch (e) {
          return match;
        }
      }
    );

    // Remove CSP headers from the response
    const headers = new Headers({
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'no-store, must-revalidate',
    });

    return new NextResponse(modifiedHtml, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the webpage' },
      { status: 500 }
    );
  }
} 