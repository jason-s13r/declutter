const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');

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

      const host = url
        .split('/')
        .slice(0, 3)
        .join('/');
      Array.from(node.querySelectorAll('[src^="/"]'))
        .filter(e => /^\/[^\/]/.test(e.attributes.src.value))
        .forEach(e => {
          e.attributes.src.value = `${host}${e.attributes.src.value}`;
        });
      Array.from(node.querySelectorAll('[href^="/"]'))
        .filter(e => /^\/[^\/]/.test(e.attributes.href.value))
        .forEach(e => {
          e.attributes.href.value = `${host}${e.attributes.href.value}`;
        });

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

module.exports = async url => {
  const site = sites.find(s => s.host.test(url));
  if (!site) {
    throw new Error('Unsupported website');
  }

  const browser = await puppeteer.launch();
  const tab = await browser.newPage();
  await tab.setUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)');
  await tab.setViewport({ width: 2000, height: 10000 });
  await tab.goto(url, { timeout: site.timeout, waitUntil: site.waitUntil });
  if (site.publisher === 'NZ Herald') {
    await bypass(tab);
  }

  const content = await buildContent(tab, site, url);
  const title = await getText(tab, site.selectors.title);
  const author = await getAuthorName(tab, site.selectors.authorName);
  const publisher = await getPublisherName(tab, site);
  const premium = (await getPremiumTag(tab, site)) || '';
  const authorName = cleanHtmlText([author, publisher + premium].filter(s => !!s.trim()).join(' &bull; '));

  const account = await telegraph.createAccount({
    author_name: authorName,
    author_url: url,
    short_name: author || site.publisher
  });
  const page = await telegraph.createPage(title, content, account);

  return page.url;
};
