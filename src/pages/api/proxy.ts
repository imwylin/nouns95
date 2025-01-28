import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const BROWSERLESS_URL = `https://chrome.browserless.io`;

async function fetchWithBrowser(url: string) {
  const script = `
    async function getData() {
      const result = {
        html: document.documentElement.outerHTML,
        title: document.title,
        baseUrl: window.location.href,
      };

      // Get all resources
      const resources = performance.getEntriesByType('resource');
      result.resources = resources.map(r => ({
        name: r.name,
        type: r.initiatorType
      }));

      return result;
    }
    getData();
  `;

  const response = await fetch(`${BROWSERLESS_URL}/content?token=${BROWSERLESS_API_KEY}`, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      elements: [],
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: 10000,
      },
      javascript: script,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }

  return response.json();
}

async function fetchDirect(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  const contentType = response.headers.get('content-type') || '';
  
  // For non-HTML content, return directly
  if (!contentType.includes('text/html')) {
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return response;
}

export default async function handler(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const useBrowser = req.nextUrl.searchParams.get('useBrowser') === 'true';
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    let content;
    let baseUrl = url;

    if (useBrowser && BROWSERLESS_API_KEY) {
      // Use browserless.io for full browser rendering
      const result = await fetchWithBrowser(url);
      content = result.html;
      baseUrl = result.baseUrl;
    } else {
      // Fallback to direct fetch
      const response = await fetchDirect(url);
      if (response instanceof NextResponse) {
        return response;
      }
      content = await response.text();
    }

    // Inject our navigation script
    const script = `
      <script>
        (function() {
          const baseUrl = '${baseUrl}';
          
          function handleNavigation(url) {
            // Check if it's an absolute URL
            let targetUrl;
            try {
              targetUrl = new URL(url, baseUrl).href;
            } catch (e) {
              return;
            }

            // Send message to parent window
            window.parent.postMessage({
              type: 'navigate',
              url: targetUrl,
              useBrowser: ${useBrowser}
            }, '*');
          }

          // Handle clicks on links
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
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
            
            if (form.method.toLowerCase() === 'get') {
              e.preventDefault();
              const formData = new FormData(form);
              const searchParams = new URLSearchParams(formData);
              const actionUrl = form.action || window.location.href;
              const targetUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + searchParams.toString();
              
              handleNavigation(targetUrl);
            }
          }, true);

          // Handle History API
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
        })();
      </script>
    `;

    // Process HTML content
    let modifiedContent = content;

    // Remove existing base tags and CSP meta tags
    modifiedContent = modifiedContent.replace(/<base[^>]*>/gi, '');
    modifiedContent = modifiedContent.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

    // Add our base tag and script
    const headContent = `
      <base href="${baseUrl}">
      <meta name="referrer" content="no-referrer">
      ${script}
    `;

    // Insert head content
    if (modifiedContent.includes('</head>')) {
      modifiedContent = modifiedContent.replace('</head>', `${headContent}</head>`);
    } else if (modifiedContent.includes('<body')) {
      modifiedContent = modifiedContent.replace('<body', `<head>${headContent}</head><body`);
    } else {
      modifiedContent = `<head>${headContent}</head>${modifiedContent}`;
    }

    // Convert relative URLs to absolute
    modifiedContent = modifiedContent.replace(
      /(src|href|action)="(?!javascript:|data:|#|blob:|https?:\/\/|\/\/)(.*?)"/gi,
      (match: string, attr: string, path: string) => {
        if (!path) return match;
        try {
          const absoluteUrl = new URL(path, baseUrl).href;
          return `${attr}="${absoluteUrl}"`;
        } catch (e) {
          return match;
        }
      }
    );

    return new NextResponse(modifiedContent, {
      status: 200,
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