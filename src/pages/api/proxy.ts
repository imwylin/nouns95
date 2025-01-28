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
    
    // Create a base URL for resolving relative URLs
    const baseUrl = new URL(url);
    
    const script = `
      <script>
        (function() {
          const baseUrl = '${baseUrl}';
          const proxyPath = '/api/proxy';

          // Function to convert relative URLs to absolute
          function resolveUrl(url) {
            try {
              return new URL(url, baseUrl).href;
            } catch (e) {
              return url;
            }
          }

          // Function to proxy a URL through our API
          function proxyUrl(url) {
            return proxyPath + '?url=' + encodeURIComponent(resolveUrl(url));
          }

          // Handle navigation
          function handleNavigation(url) {
            window.parent.postMessage({
              type: 'navigate',
              url: resolveUrl(url)
            }, '*');
          }

          // Override window.fetch
          const originalFetch = window.fetch;
          window.fetch = async function(input, init) {
            try {
              const url = input instanceof Request ? input.url : input;
              const proxiedUrl = proxyUrl(url);
              const newInput = input instanceof Request ? 
                new Request(proxiedUrl, input) : proxiedUrl;
              return originalFetch(newInput, init);
            } catch (e) {
              return originalFetch(input, init);
            }
          };

          // Override XMLHttpRequest
          const XHR = XMLHttpRequest.prototype;
          const originalOpen = XHR.open;
          XHR.open = function(method, url, ...args) {
            const proxiedUrl = proxyUrl(url);
            return originalOpen.call(this, method, proxiedUrl, ...args);
          };

          // Handle clicks on links
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Allow special URLs to work normally
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || 
                href.startsWith('tel:') || href.startsWith('#')) {
              return;
            }

            e.preventDefault();
            handleNavigation(href);
          }, true);

          // Handle form submissions
          document.addEventListener('submit', function(e) {
            const form = e.target;
            if (!form || !(form instanceof HTMLFormElement)) return;
            
            const method = (form.method || 'get').toLowerCase();
            if (method === 'get') {
              e.preventDefault();
              
              const formData = new FormData(form);
              const searchParams = new URLSearchParams(formData);
              const actionUrl = form.action || window.location.href;
              const targetUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + searchParams.toString();
              
              handleNavigation(targetUrl);
            }
          }, true);

          // Handle history API
          const originalPushState = history.pushState;
          const originalReplaceState = history.replaceState;

          history.pushState = function(state, title, url) {
            if (url) handleNavigation(url);
            return originalPushState.apply(this, arguments);
          };

          history.replaceState = function(state, title, url) {
            if (url) handleNavigation(url);
            return originalReplaceState.apply(this, arguments);
          };

          // Handle window.open
          const originalOpen = window.open;
          window.open = function(url, ...args) {
            if (url) handleNavigation(url);
            return null;
          };

          // Proxy image sources
          const originalImage = window.Image;
          window.Image = function(...args) {
            const img = new originalImage(...args);
            const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            
            Object.defineProperty(img, 'src', {
              get: function() {
                return originalSrcDescriptor.get.call(this);
              },
              set: function(url) {
                originalSrcDescriptor.set.call(this, proxyUrl(url));
              }
            });
            
            return img;
          };
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

    // Convert relative URLs to absolute
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

    // Return the modified HTML with appropriate headers
    return new NextResponse(modifiedHtml, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-store, must-revalidate',
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