const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const util = require('util');
const process = require('process');

const domToNode = require('./dom-node');
const telegraph = require('./telegraph');
const bypass = require('./bypass');

const fixRelativeLinks = async (tab, url) => {
  return await tab.evaluate(url => {
    const host = url
      .split('/')
      .slice(0, 3)
      .join('/');

    Array.from(document.querySelectorAll('[src^="/"]'))
      .filter(e => e.attributes.src && /^\/[^\/]/.test(e.attributes.src.value))
      .forEach(e => {
        e.attributes.src.value = `${host}${e.attributes.src.value}`;
      });
    Array.from(document.querySelectorAll('[href^="/"]'))
      .filter(e => e.attributes.href && /^\/[^\/]/.test(e.attributes.href.value))
      .forEach(e => {
        e.attributes.href.value = `${host}${e.attributes.href.value}`;
      });
  }, url);
};

const getExtensions = async () => {
  const extensionDir = path.join(__dirname, '../extensions');
  const exists = await util.promisify(fs.exists)(extensionDir);
  if (!exists) {
    return [];
  }
  const ls = await util.promisify(fs.readdir)(extensionDir);
  const extensions = ls.map(name => '--load-extension=' + path.join(extensionDir, name));
  return extensions;
};

module.exports = async url => {
  if (/(master)?\.m3u8/i.test(url)) {
    return {
      title: 'm3u8 stream',
      author: '',
      publisher: url
        .split('/')
        .slice(0, 3)
        .join('/'),
      streams: [url]
    };
  }
  const extensions = await getExtensions();
  const browser = await puppeteer.launch({
    args: [].concat(extensions),
    executablePath:
      process.env.DECLUTTER_CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\Chrome.exe',
    headless: true
  });
  const tab = await browser.newPage();
  try {
    const streams = [];

    tab.on('request', request => {
      if (/(master)?\.m3u8/.test(request.url())) {
        streams.push(request.url());
      }
    });

    await tab.setViewport({ width: 3840, height: 4096 });
    await tab.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
    );
    await tab.goto(url, {
      timeout: 30000,
      waitUntil: 'networkidle2'
    });
    await fixRelativeLinks(tab, url);
    await tab.waitFor(extensions.length > 0 ? 3000 : 1000);

    let { title, author, publisher } = await tab.evaluate(url => {
      const $author = document.querySelector('meta[property="og:site_name"]');
      const $title = document.querySelector('meta[property="og:title"]');
      return {
        title: $title && $title.content ? $title.content : '',
        author: $author && $author.content ? $author.content : '',
        publisher: new URL(url).host
      };
    }, url);

    await tab.close();
    await browser.close();

    return {
      title,
      author,
      publisher,
      streams
    };
  } catch (e) {
    await tab.close();
    await browser.close();
    throw e;
  }
};
