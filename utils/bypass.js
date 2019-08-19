const { JSDOM } = require('jsdom');

const { parse } = require('./ld');
const telegraph = require('./telegraph');
const domToNode = require('./dom-node');

const findArticleSchema = document => {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(e => parse(e.textContent))
    .find(l => {
      if (!l) {
        return false;
      }
      const isSchema = l['@context'] === 'http://schema.org';
      const isArticle = l['@type'] === 'Article';
      return isSchema && isArticle;
    });
};

const cleanHtmlText = text => {
  const s = new JSDOM('').window.document.createElement('span');
  s.innerHTML = text;
  return s.textContent;
};

const buildContent = (document, url) => {
  const node = document.querySelector('.full-content,.premium-content').cloneNode({ deep: true });
  const bad = node.querySelectorAll('meta,script,style,.related-header,.related-articles-container,.ad-container');
  [].forEach.call(bad, b => b.remove());

  const source = document.createElement('p');
  source.innerHTML = `<a href="${url}"">${url}</a>.`;
  node.prepend(source);

  return domToNode(node).children.filter(m => !m.trim || m.trim().length > 0);
};

module.exports = async url => {
  const DOM = await JSDOM.fromURL(url);
  const document = DOM.window.document;

  const ld = findArticleSchema(document);

  const content = buildContent(document, url);
  const title = cleanHtmlText(ld.headline);
  let premium = '';
  if (ld.hasPart && ld.hasPart.isAccessibleForFree) {
    premium = ' Premium';
  }
  const authorName = cleanHtmlText(`${ld.author.name} &bull; ${ld.publisher.name}${premium}`);

  const account = await telegraph.createAccount({
    author_name: authorName,
    author_url: url,
    short_name: ld.author.name
  });
  const page = await telegraph.createPage(title, content, account);

  return page.url;
};
