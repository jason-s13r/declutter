const { JSDOM } = require("jsdom");
const { firefox } = require("playwright");
const { Readability } = require("@mozilla/readability");

const { addMetadata, extractMetadata } = require('./extract-metadata');
const domToNode = require("./dom-node");
const telegraph = require("./telegraph");

const { getUserAgent } = require('./user-agent');
const { blockedRegexes, matchUrlDomain } = require("./sites");


module.exports.declutter = async (url) => {
  const { userAgent, headers } = getUserAgent(url);

  const browser = await firefox.launch({ args: [], headless: true });
  const tab = await browser.newPage({
    extraHTTPHeaders: headers,
    userAgent,
    viewport: { width: 2000, height: 10000 },
  });

  try {
    await tab.route(/.*/, (route) => {
      const routeUrl = route.request().url();
      const blockedDomains = Object.keys(blockedRegexes);
      const domain = matchUrlDomain(blockedDomains, routeUrl);
      if (domain && routeUrl.match(blockedRegexes[domain])) {
        return route.abort();
      }
      return route.continue();
    });
    await tab.addInitScript({ path: "bypass-paywalls-chrome/src/js/contentScript.js" });
    await tab.addInitScript({ path: "scripts/cosmeticFilter.js" });
    await tab.addInitScript({ path: "scripts/fix-relative-links.js" });
    await tab.goto(url, { timeout: 90000, waitUntil: "domcontentloaded" });
    await tab.waitForTimeout(2000);

    let { author, publisher, authorType } = await extractMetadata(tab, url)

    const body = await tab.content();
    const doc = new JSDOM(body, { url });
    const reader = new Readability(doc.window.document);
    let readable = reader.parse();

    readable = addMetadata(readable, authorType, author, publisher, url);

    return readable;
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await tab.close();
    await browser.close();
  }
};

module.exports.telegraph = async (url, readable) => {
  const account = await telegraph.createAccount({
    author_name: readable.author,
    author_url: url,
    short_name: (
      readable.author ||
      readable.publisher ||
      readable.byline
    ).substring(0, 31),
  });

  const dom = new JSDOM(`<html><body>${readable.content}</body></html>`);
  const div = dom.window.document.querySelector("body");
  const source = dom.window.document.createElement("p");
  source.innerHTML = `<a href="${url}"">${url}</a>`;
  div.prepend(source);
  const content = domToNode(div).children.filter((m) => {
    return !m.trim || m.trim().length > 0;
  });
  const page = await telegraph.createPage(readable.title, content, account);
  return page;
};
