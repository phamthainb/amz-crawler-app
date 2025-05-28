import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ua from 'user-agents';

export async function crawlProduct(url: string, index: number): Promise<any> {
  let dataDir = path.join('browser', 'userData', `thread-${Date.now()}-${index}`);
  // Detect platform and set Chromium path
  const chromePath = (() => {
    const platform = os.platform();
    if (platform === 'win32') {
      return path.resolve('browser', 'chrome.exe');
    } else if (platform === 'darwin') {
      return path.resolve('browser', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    } else {
      throw new Error(`Unsupported OS: ${platform}`);
    }
  })();

  // Check if Chromium exists
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chromium not found at ${chromePath}`);
  }

  // Stack position logic
  const offsetX = 0; // pixels to shift horizontally per thread
  const offsetY = 50; // pixels to shift vertically per thread
  const baseX = 0;
  const baseY = 0;
  const windowX = baseX + index * offsetX;
  const windowY = baseY + index * offsetY;

  console.log(`Launching browser at position: (${windowX}, ${windowY})`);

  const browser = await puppeteer.launch({
    timeout: 0,
    executablePath: chromePath,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      `--window-size=1200,800`,
      `--window-position=${windowX},${windowY}`
    ],
    // ignoreDefaultArgs: ['--enable-automation', '--disable-infobars'],
    userDataDir: dataDir,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  });

  var [page] = await browser.pages();

  const userAgent = new ua({
    deviceCategory: 'desktop'
  }).toString();

  console.log(`Using User-Agent: ${userAgent}`);
  await page.setUserAgent(userAgent);

  try {
    await page.goto(url);
    const title = await page.title();
    // await browser.close();

    // detect if got blocked by Amazon
    const blockList = [
      'Access Denied',
      'Amazon Error',
      '503',
      'Service Unavailable',
      'Request blocked',
      'Request denied',
      'You are being rate limited',
      'Please try again later',
      'Too many requests',
      'We apologize for the inconvenience',
      'Please try again',
      'Server Busy'
    ];
    if (blockList.some((block) => title.includes(block))) {
      // throw new Error(`Access Denied or Amazon Error for URL: ${url}`);
      console.error(`Access Denied or Amazon Error for URL: ${url}`);
    }

    // scroll to the bottom of the page
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollTo(0, scrollHeight);
        setTimeout(() => {
          resolve(true);
        }, 2000); // wait for 2 seconds to ensure the page is fully loaded
      });
    });

    // scroll to the mid of the page
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const midHeight = document.body.scrollHeight / 2;
        window.scrollTo(0, midHeight);
        setTimeout(() => {
          resolve(true);
        }, 2000); // wait for 2 seconds to ensure the page is fully loaded
      });
    });

    // scroll to the top of the page
    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.scrollTo(0, 0);
        setTimeout(() => {
          resolve(true);
        }, 2000); // wait for 2 seconds to ensure the page is fully loaded
      });
    });

    // start extracting data

    return {
      url,
      title
    };
  } catch (error) {
    // await browser.close();
    console.error(`Error crawling ${url}:`, error);
    return {
      url,
      title: 'N/A',
      price: 'N/A',
      error: String(error)
    };
  } finally {
    // Ensure the user data directory is cleaned up
    console.log(`Cleaning up user data directory: ${dataDir}`);
    if (fs.existsSync(dataDir)) {
      fs.rmdirSync(dataDir, { recursive: true });
    }
  }
}

(async () => {
  const url = 'https://www.amazon.com/dp/B09WCV1YVP'; // Replace with your URL
  const index = 0; // Replace with your thread index
  try {
    const result = await crawlProduct(url, index);
    console.log('Crawl result:', result);
  } catch (error) {
    console.error('Crawl failed:', error);
  }
})();
