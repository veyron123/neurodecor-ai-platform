// download-slider-images.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const urlModule = require('url');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const destDir = path.join(__dirname, 'frontend', 'public', 'slider-images');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto('https://www.propstyle.ai', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.slick-slide img, .hero-slider img', { timeout: 60000 });

    const imageUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.slick-slide img, .hero-slider img'));
      return Array.from(new Set(imgs.map(img => img.src).filter(Boolean)));
    });

    console.log('Найдено изображений:', imageUrls.length);

    await browser.close();

    for (const imgUrl of imageUrls) {
      const { pathname } = urlModule.parse(imgUrl);
      const filename = path.basename(pathname);
      const filePath = path.join(destDir, filename);

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(imgUrl, response => {
          response.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
            console.log('Скачан:', filename);
          });
        }).on('error', err => {
          fs.unlink(filePath, () => {});
          console.error('Ошибка при скачивании:', imgUrl, err.message);
          reject(err);
        });
      });
    }
  } catch (err) {
    console.error('Ошибка скрипта:', err);
    process.exit(1);
  }
})();