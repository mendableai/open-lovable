// Cloudflare Pages Function for Advanced Web Scraping with Screenshot Support
// Complete implementation with Cloudflare Browser Rendering API and fallbacks

interface Env {
  BROWSER_RENDERING_API?: any; // Cloudflare Browser Rendering binding
  SCREENSHOT_API_KEY?: string; // Fallback screenshot service API key
  SCREENSHOT_SERVICE_URL?: string; // Custom screenshot service URL
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request } = context;

  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the webpage content
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract basic information using advanced regex parsing
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'Untitled';

    const descriptionMatch = html.match(/<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']+)[\"']/i) ||
                            html.match(/<meta[^>]*property=[\"']og:description[\"'][^>]*content=[\"']([^\"']+)[\"']/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    
    // Extract Open Graph and Twitter Card data
    const ogImage = html.match(/<meta[^>]*property=[\"']og:image[\"'][^>]*content=[\"']([^\"']+)[\"']/i)?.[1] || '';
    const twitterImage = html.match(/<meta[^>]*name=[\"']twitter:image[\"'][^>]*content=[\"']([^\"']+)[\"']/i)?.[1] || '';

    // Extract CSS styles
    const cssMatches = html.match(/<style[^>]*>([^<]*)<\/style>/gi) || [];
    const inlineCss = cssMatches.map(match => {
      const cssContent = match.replace(/<\/?style[^>]*>/gi, '');
      return cssContent;
    }).join('\\n');

    // Extract external CSS links
    const cssLinks = [];
    const linkMatches = html.match(/<link[^>]*rel=[\"']stylesheet[\"'][^>]*>/gi) || [];
    for (const linkMatch of linkMatches) {
      const hrefMatch = linkMatch.match(/href=[\"']([^\"']+)[\"']/i);
      if (hrefMatch) {
        cssLinks.push(hrefMatch[1]);
      }
    }

    // Try to fetch external CSS (first few only to avoid timeout)
    let externalCss = '';
    for (let i = 0; i < Math.min(cssLinks.length, 3); i++) {
      try {
        let cssUrl = cssLinks[i];
        if (cssUrl.startsWith('/')) {
          cssUrl = `${targetUrl.origin}${cssUrl}`;
        } else if (!cssUrl.startsWith('http')) {
          cssUrl = `${targetUrl.origin}/${cssUrl}`;
        }
        
        const cssResponse = await fetch(cssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Open-Lovable/1.0)' }
        });
        
        if (cssResponse.ok) {
          const cssContent = await cssResponse.text();
          externalCss += `\\n/* From ${cssUrl} */\\n${cssContent}\\n`;
        }
      } catch (error) {
        console.error(`Failed to fetch CSS ${cssLinks[i]}:`, error);
      }
    }

    // Extract colors from CSS
    const allCss = inlineCss + externalCss;
    const colors = extractColors(allCss);

    // Extract meta tags
    const metaTags: { [key: string]: string } = {};
    const metaMatches = html.match(/<meta[^>]*>/gi) || [];
    for (const metaMatch of metaMatches) {
      const nameMatch = metaMatch.match(/name=[\"']([^\"']+)[\"']/i);
      const contentMatch = metaMatch.match(/content=[\"']([^\"']+)[\"']/i);
      if (nameMatch && contentMatch) {
        metaTags[nameMatch[1]] = contentMatch[1];
      }
    }

    const scrapedData = {
      url: targetUrl.toString(),
      title,
      description,
      meta: metaTags,
      css: {
        inline: inlineCss,
        external: externalCss,
        links: cssLinks
      },
      colors: Array.from(colors),
      timestamp: new Date().toISOString(),
      // Note: No screenshot available without browser automation
      screenshot: await captureScreenshot(targetUrl.toString(), env),
      socialImages: {
        ogImage,
        twitterImage,
        favicon: extractFavicon(html, targetUrl)
      },
      content: {
        length: html.length,
        hasImages: html.includes('<img'),
        hasVideo: html.includes('<video'),
        hasForms: html.includes('<form'),
        hasCanvas: html.includes('<canvas'),
        hasInteractive: html.includes('onclick=') || html.includes('addEventListener'),
        scripts: extractScriptSources(html, targetUrl),
        fonts: extractFontReferences(html)
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: scrapedData
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Scrape URL error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape URL',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'ScrapingError'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}

// Advanced screenshot capture with multiple fallback strategies
async function captureScreenshot(url: string, env: Env): Promise<string | null> {
  try {
    // Strategy 1: Cloudflare Browser Rendering API (if available)
    if (env.BROWSER_RENDERING_API) {
      try {
        console.log('[scrape-url] Attempting screenshot with Cloudflare Browser Rendering API');
        
        const response = await env.BROWSER_RENDERING_API.screenshot({
          url: url,
          options: {
            format: 'png',
            width: 1280,
            height: 720,
            fullPage: false,
            waitFor: 2000 // Wait 2 seconds for page to load
          }
        });
        
        if (response && response.success) {
          const base64Screenshot = btoa(String.fromCharCode(...new Uint8Array(response.screenshot)));
          console.log('[scrape-url] ✅ Screenshot captured with Cloudflare Browser Rendering');
          return `data:image/png;base64,${base64Screenshot}`;
        }
      } catch (error) {
        console.error('[scrape-url] Cloudflare Browser Rendering failed:', error);
      }
    }
    
    // Strategy 2: Third-party screenshot service (if configured)
    if (env.SCREENSHOT_SERVICE_URL && env.SCREENSHOT_API_KEY) {
      try {
        console.log('[scrape-url] Attempting screenshot with third-party service');
        
        const screenshotResponse = await fetch(env.SCREENSHOT_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.SCREENSHOT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            width: 1280,
            height: 720,
            fullPage: false,
            format: 'png'
          })
        });
        
        if (screenshotResponse.ok) {
          const screenshotData = await screenshotResponse.arrayBuffer();
          const base64Screenshot = btoa(String.fromCharCode(...new Uint8Array(screenshotData)));
          console.log('[scrape-url] ✅ Screenshot captured with third-party service');
          return `data:image/png;base64,${base64Screenshot}`;
        }
      } catch (error) {
        console.error('[scrape-url] Third-party screenshot service failed:', error);
      }
    }
    
    // Strategy 3: Public screenshot API services (rate-limited but free)
    const publicServices = [
      `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1280x720&format=png`,
      `https://htmlcsstoimage.com/demo_run/ce7a8d72-e530-4064-ad25-c6e5e3c43e49/${encodeURIComponent(url)}`
    ];
    
    for (const serviceUrl of publicServices) {
      try {
        console.log('[scrape-url] Trying public screenshot service:', serviceUrl.split('?')[0]);
        
        const response = await fetch(serviceUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Open-Lovable/1.0 (Website Builder Bot)'
          }
        });
        
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          const imageData = await response.arrayBuffer();
          const base64Screenshot = btoa(String.fromCharCode(...new Uint8Array(imageData)));
          console.log('[scrape-url] ✅ Screenshot captured with public service');
          return `data:image/png;base64,${base64Screenshot}`;
        }
      } catch (error) {
        console.error('[scrape-url] Public screenshot service failed:', error);
      }
    }
    
    console.log('[scrape-url] ❌ All screenshot strategies failed');
    return null;
  } catch (error) {
    console.error('[scrape-url] Screenshot capture error:', error);
    return null;
  }
}

// Extract favicon URL
function extractFavicon(html: string, baseUrl: URL): string | null {
  const faviconPatterns = [
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i
  ];
  
  for (const pattern of faviconPatterns) {
    const match = html.match(pattern);
    if (match) {
      let faviconUrl = match[1];
      if (faviconUrl.startsWith('/')) {
        faviconUrl = `${baseUrl.origin}${faviconUrl}`;
      } else if (!faviconUrl.startsWith('http')) {
        faviconUrl = `${baseUrl.origin}/${faviconUrl}`;
      }
      return faviconUrl;
    }
  }
  
  // Fallback to default favicon location
  return `${baseUrl.origin}/favicon.ico`;
}

// Extract script sources
function extractScriptSources(html: string, baseUrl: URL): string[] {
  const scripts: string[] = [];
  const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
  
  for (const script of scriptMatches) {
    const srcMatch = script.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      let scriptUrl = srcMatch[1];
      if (scriptUrl.startsWith('/')) {
        scriptUrl = `${baseUrl.origin}${scriptUrl}`;
      } else if (!scriptUrl.startsWith('http') && !scriptUrl.startsWith('//')) {
        scriptUrl = `${baseUrl.origin}/${scriptUrl}`;
      }
      scripts.push(scriptUrl);
    }
  }
  
  return scripts.slice(0, 10); // Limit to first 10 scripts
}

// Extract font references
function extractFontReferences(html: string): string[] {
  const fonts: string[] = [];
  
  // Google Fonts
  const googleFontMatches = html.match(/fonts\.googleapis\.com\/css[^"']*/g) || [];
  googleFontMatches.forEach(font => {
    const familyMatch = font.match(/family=([^&"']*)/i);
    if (familyMatch) {
      fonts.push(decodeURIComponent(familyMatch[1].replace(/\+/g, ' ')));
    }
  });
  
  // Font-family declarations in CSS
  const fontFamilyMatches = html.match(/font-family:\s*["']?([^;"']+)["']?/gi) || [];
  fontFamilyMatches.forEach(match => {
    const familyMatch = match.match(/font-family:\s*["']?([^;"']+)["']?/i);
    if (familyMatch) {
      fonts.push(familyMatch[1].trim());
    }
  });
  
  return [...new Set(fonts)].slice(0, 5); // Unique fonts, limit to 5
}

function extractColors(css: string): Set<string> {
  const colors = new Set<string>();
  
  // Match hex colors (3, 6, and 8 digit)
  const hexMatches = css.match(/#([a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})/gi) || [];
  hexMatches.forEach(color => colors.add(color.toLowerCase()));
  
  // Match rgb colors
  const rgbMatches = css.match(/rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi) || [];
  rgbMatches.forEach(color => colors.add(color.toLowerCase().replace(/\s/g, '')));
  
  // Match rgba colors
  const rgbaMatches = css.match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi) || [];
  rgbaMatches.forEach(color => colors.add(color.toLowerCase().replace(/\s/g, '')));
  
  // Match hsl colors
  const hslMatches = css.match(/hsl\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/gi) || [];
  hslMatches.forEach(color => colors.add(color.toLowerCase().replace(/\s/g, '')));
  
  // Match hsla colors
  const hslaMatches = css.match(/hsla\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/gi) || [];
  hslaMatches.forEach(color => colors.add(color.toLowerCase().replace(/\s/g, '')));
  
  // Match CSS custom properties (CSS variables)
  const cssVarMatches = css.match(/--[\w-]+\s*:\s*[^;]+/gi) || [];
  cssVarMatches.forEach(cssVar => {
    if (cssVar.includes('#') || cssVar.includes('rgb') || cssVar.includes('hsl')) {
      colors.add(cssVar.toLowerCase());
    }
  });
  
  // Match named colors (comprehensive list)
  const namedColors = [
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond',
    'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
    'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
    'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid',
    'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
    'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
    'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
    'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory',
    'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
    'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
    'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
    'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
    'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
    'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
    'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid',
    'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
    'peru', 'pink', 'plum', 'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown',
    'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
    'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato',
    'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
  ];
  
  const lowerCss = css.toLowerCase();
  namedColors.forEach(color => {
    // Use word boundaries to avoid matching parts of other words
    const colorRegex = new RegExp(`\\b${color}\\b`, 'g');
    if (colorRegex.test(lowerCss)) {
      colors.add(color);
    }
  });
  
  return colors;
}

// Handle CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}