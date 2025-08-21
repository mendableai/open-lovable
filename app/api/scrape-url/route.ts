import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let targetUrl = url.trim();
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Scrape the website
    const scrapedData = await scrapeWebsite(targetUrl);

    return NextResponse.json({
      success: true,
      data: scrapedData
    });

  } catch (error) {
    console.error('Web scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    );
  }
}

async function scrapeWebsite(url: string) {
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to URL with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Extract page data
    const pageData = await page.evaluate(() => {
      // Get page title
      const title = document.title || '';

      // Get meta description
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // Get main content (try different selectors)
      const mainContent = 
        document.querySelector('main')?.textContent?.trim() ||
        document.querySelector('article')?.textContent?.trim() ||
        document.querySelector('.content')?.textContent?.trim() ||
        document.querySelector('#content')?.textContent?.trim() ||
        document.body.textContent?.trim() || '';

      // Get all text content
      const allText = document.body.textContent?.trim() || '';

      // Get HTML structure
      const html = document.documentElement.outerHTML;

      // Get CSS styles
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch {
            return '';
          }
        })
        .filter(style => style.length > 0)
        .join('\n');

      // Get images
      const images = Array.from(document.images)
        .map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        }))
        .filter(img => img.src && img.src.startsWith('http'));

      // Get links
      const links = Array.from(document.links)
        .map(link => ({
          href: link.href,
          text: link.textContent?.trim(),
          title: link.title
        }))
        .filter(link => link.href && link.href.startsWith('http'));

      // Get form elements
      const forms = Array.from(document.forms)
        .map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.elements)
            .map(element => ({
              name: (element as HTMLInputElement).name,
              type: (element as HTMLInputElement).type,
              placeholder: (element as HTMLInputElement).placeholder
            }))
        }));

      // Get color scheme
      const computedStyle = window.getComputedStyle(document.body);
      const colors = {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        primaryColor: computedStyle.getPropertyValue('--primary-color') || 
                     computedStyle.getPropertyValue('--color-primary') ||
                     computedStyle.getPropertyValue('--brand-color')
      };

      return {
        title,
        metaDescription,
        mainContent: mainContent.substring(0, 5000), // Limit content size
        allText: allText.substring(0, 10000), // Limit text size
        html: html.substring(0, 50000), // Limit HTML size
        styles: styles.substring(0, 10000), // Limit CSS size
        images: images.slice(0, 20), // Limit number of images
        links: links.slice(0, 50), // Limit number of links
        forms: forms.slice(0, 10), // Limit number of forms
        colors,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    });

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      quality: 80
    });

    return {
      ...pageData,
      screenshot: screenshot.toString('base64'),
      screenshotUrl: `data:image/png;base64,${screenshot.toString('base64')}`
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}