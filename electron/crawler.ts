import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
      `--window-size=1200,800`,
      `--window-position=${windowX},${windowY}`
    ],
    ignoreDefaultArgs: ['--enable-automation', '--disable-infobars'],
    // userDataDir: dataDir,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  });

  const page = await browser.newPage();

  try {
    await page.goto(url);
    const title = await page.title();
    await browser.close();

    return {
      url,
      title
    };
  } catch (error) {
    await browser.close();
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
