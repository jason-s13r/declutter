const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');
const Readability = require('readability');
const path = require('path');
const fs = require('fs');
const util = require('util');

const domToNode = require('./dom-node');
const telegraph = require('./telegraph');
const sites = require('./sites');
const bypass = require('./bypass');

const cleanHtmlText = text => {
  const s = new JSDOM('').window.document.createElement('span');
  s.innerHTML = text;
  return s.textContent;
};

const getText = async (tab, selector) => {
  return await tab.evaluate(
    ([selector]) => {
      if (!selector) {
        return '';
      }
      const node = selector.split(',').reduce((p, s) => p || document.querySelector(s), null);
      return node ? node.textContent.trim() : '';
    },
    [selector]
  );
};

const getAuthorName = async (tab, selector) => {
  return (await getText(tab, selector)).replace(/^By /i, '');
};

const getPublisherName = async (tab, site) => {
  const publisher = (await getText(tab, site.selectors.publisher)) || site.publisher;
  if (publisher !== site.publisher) {
    return `${publisher} via ${site.publisher}`;
  }
  return publisher;
};

const getPremiumTag = async (tab, site) => {
  return await tab.evaluate(
    ([site]) => {
      return site.selectors.premium && !!document.querySelector(site.selectors.premium) ? site.premium : '';
    },
    [site]
  );
};

const buildContent = async (tab, site, url) => {
  return await tab.evaluate(
    ([site, url]) => {
      const node = document.querySelector(site.selectors.content).cloneNode({ deep: true });
      Array.from(node.querySelectorAll('meta,link,script,style'))
        .concat(site.selectors.bad ? Array.from(node.querySelectorAll(site.selectors.bad)) : [])
        .forEach(b => b.remove());

      const source = document.createElement('p');
      source.innerHTML = `<a href="${url}"">${url}</a>.`;
      node.prepend(source);

      function domToNode(domNode) {
        if (domNode.nodeType == domNode.TEXT_NODE) {
          return domNode.data;
        }
        if (domNode.nodeType != domNode.ELEMENT_NODE) {
          return false;
        }
        var nodeElement = {};
        nodeElement.tag = domNode.tagName.toLowerCase();
        for (var i = 0; i < domNode.attributes.length; i++) {
          var attr = domNode.attributes[i];
          if (!nodeElement.attrs) {
            nodeElement.attrs = {};
          }
          if ('href src data-srcset alt srcset'.includes(attr.name)) {
            nodeElement.attrs[attr.name] = attr.value;
          }
        }
        if (domNode.childNodes.length > 0) {
          nodeElement.children = [];
          for (var i = 0; i < domNode.childNodes.length; i++) {
            var child = domNode.childNodes[i];
            nodeElement.children.push(domToNode(child));
          }
        }
        return nodeElement;
      }

      return domToNode(node).children.filter(m => !m.trim || m.trim().length > 0);
    },
    [site, url]
  );
};

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

const buildReadableContent = async (tab, url) => {
  const document = new JSDOM(await tab.content(), { url }).window.document;
  const article = new Readability(document).parse();
  const dom = new JSDOM(`<html><body>${article.content}</body></html>`);
  const div = dom.window.document.querySelector('div');
  const source = dom.window.document.createElement('p');
  source.innerHTML = `<a href="${url}"">${url}</a>.`;
  div.prepend(source);
  content = domToNode(div).children.filter(m => !m.trim || m.trim().length > 0);
  return { content, title: article.title };
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

const UA = site => {
  if (!site || !site.userAgent) {
    return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36';
  }
  return site.userAgent;
};

module.exports = async url => {
  const extensions = await getExtensions();
  const browser = await puppeteer.launch({ headless: true, args: [].concat(extensions) });
  const tab = await browser.newPage();
  try {
    const site = sites.find(s => s.host.test(url));

    await tab.setViewport({ width: 2000, height: 10000 });
    await tab.setUserAgent(UA(site));
    await tab.goto(url, {
      timeout: site ? site.timeout : 60000,
      waitUntil: site ? site.waitUntil : 'networkidle0'
    });
    await fixRelativeLinks(tab, url);
    await bypass(tab, url);
    await tab.waitFor(extensions.length > 0 ? 3000 : 1000);

    let [premium, content, title] = ['', '', ''];
    let { author, publisher } = await tab.evaluate(url => {
      const $author = document.querySelector('meta[property="og:site_name"]');
      return {
        author: $author && $author.content ? $author.content : '',
        publisher: new URL(url).host
      };
    }, url);

    if (!site) {
      const readable = await buildReadableContent(tab, url);
      title = readable.title;
      content = readable.content;
    }

    if (site) {
      const meta = await Promise.all([
        buildContent(tab, site, url),
        getText(tab, site.selectors.title),
        getAuthorName(tab, site.selectors.authorName),
        getPublisherName(tab, site),
        getPremiumTag(tab, site)
      ]);
      content = meta[0];
      title = meta[1];
      author = meta[2];
      publisher = meta[3];
      premium = meta[4] || '';
    }

    await tab.close();
    await browser.close();

    const authorName = cleanHtmlText([author, publisher + premium].filter(s => !!s && !!s.trim()).join(' &bull; '));

    const account = await telegraph.createAccount({
      author_name: authorName,
      author_url: url,
      short_name: (author || publisher || authorName).substring(0, 31)
    });
    const page = await telegraph.createPage(title, content, account);

    return page.url;
  } catch (e) {
    await tab.close();
    await browser.close();
    throw e;
  }
};
