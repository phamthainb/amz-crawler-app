import puppeteer from 'puppeteer-core';

export async function crawlProduct(url: string) {
  const browser = await puppeteer.launch({
    executablePath: '/path/to/chrome',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const title = await page.title();
  const price = await page.$eval('#priceblock_ourprice', (el) => el.textContent?.trim() || 'N/A');

  await browser.close();
  return { url, title, price };
}
