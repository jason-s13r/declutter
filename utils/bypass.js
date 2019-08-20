const { JSDOM } = require('jsdom');

const telegraph = require('./telegraph');
const domToNode = require('./dom-node');
const sites = require('./sites');

const cleanHtmlText = text => {
  const s = new JSDOM('').window.document.createElement('span');
  s.innerHTML = text;
  return s.textContent;
};

const getText = (document, selector) => {
  if (!selector) {
    return '';
  }
  const node = selector.split(',').reduce((p, s) => p || document.querySelector(s), null);
  return node ? node.textContent.trim() : '';
};

const getPublisherName = (document, site) => {
  const publisher = getText(document, site.selectors.publisher) || site.publisher;
  if (publisher !== site.publisher) {
    return `${publisher} via ${site.publisher}`;
  }
  return publisher;
};

const getPremiumTag = (document, site) => {
  return site.selectors.premium && !!document.querySelector(site.selectors.premium) ? site.premium : '';
};

const buildContent = (document, site, url) => {
  const node = document.querySelector(site.selectors.content).cloneNode({ deep: true });
  Array.from(node.querySelectorAll('meta,script,style'))
    .concat(site.selectors.bad ? Array.from(node.querySelectorAll(site.selectors.bad)) : [])
    .forEach(b => b.remove());

  const source = document.createElement('p');
  source.innerHTML = `<a href="${url}"">${url}</a>.`;
  node.prepend(source);

  return domToNode(node).children.filter(m => !m.trim || m.trim().length > 0);
};

module.exports = async url => {
  const DOM = await JSDOM.fromURL(url);
  const document = DOM.window.document;

  const site = sites.find(s => s.host.test(url));
  if (!site) {
    throw new Error('unknown website');
  }

  const content = buildContent(document, site, url);
  const title = getText(document, site.selectors.title);
  const author = getText(document, site.selectors.authorName);
  const publisher = getPublisherName(document, site);
  const premium = getPremiumTag(document, site) || '';
  const authorName = cleanHtmlText([author, publisher + premium].filter(s => !!s.trim()).join(' &bull; '));

  const account = await telegraph.createAccount({
    author_name: authorName,
    author_url: url,
    short_name: author || site.publisher
  });
  const page = await telegraph.createPage(title, content, account);

  return page.url;
};
