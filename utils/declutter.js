const { JSDOM } = require("jsdom");
const { firefox } = require("playwright");
const { Readability } = require("@mozilla/readability");
const path = require("path");
const fs = require("fs");
const util = require("util");

const domToNode = require("./dom-node");
const telegraph = require("./telegraph");
const {
  blockedRegexes,
  matchUrlDomain,
  useGoogleBotSites,
} = require("./sites");

const cleanHtmlText = (text) => {
  const s = new JSDOM("").window.document.createElement("span");
  s.innerHTML = text;
  return s.textContent;
};

const fixRelativeLinks = async (tab, url) => {
  return await tab.evaluate((url) => {
    const host = url.split("/").slice(0, 3).join("/");

    Array.from(document.querySelectorAll('[src^="/"]'))
      .filter(
        (e) => e.attributes.src && /^\/[^\/]/.test(e.attributes.src.value)
      )
      .forEach((e) => {
        e.attributes.src.value = `${host}${e.attributes.src.value}`;
      });
    Array.from(document.querySelectorAll('[href^="/"]'))
      .filter(
        (e) => e.attributes.href && /^\/[^\/]/.test(e.attributes.href.value)
      )
      .forEach((e) => {
        e.attributes.href.value = `${host}${e.attributes.href.value}`;
      });
  }, url);
};

const buildReadableContent = async (tab, url) => {
  const body = await tab.content();
  const doc = new JSDOM(body, { url });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();
  if (!article || !article.content) {
    return { content: [], title: "" };
  }

  const dom = new JSDOM(`<html><body>${article.content}</body></html>`);
  const div = dom.window.document.querySelector("div");
  const source = dom.window.document.createElement("p");
  source.innerHTML = `<a href="${url}"">${url}</a>`;
  div.prepend(source);
  content = domToNode(div).children.filter((m) => {
    return !m.trim || m.trim().length > 0;
  });
  return {
    content,
    title: article.title,
    byline: article.byline,
  };
};

module.exports = async (url) => {
  const browser = await firefox.launch({
    args: [],
    executablePath: process.env.DECLUTTER_BROWSER_PATH || undefined,
    headless: true,
  });

  // override User-Agent to use Googlebot
  const useGoogleBot = useGoogleBotSites.some(function (item) {
    return typeof item === "string" && matchUrlDomain(item, url);
  });

  let userAgent = undefined;
  const extraHTTPHeaders = [];
  if (useGoogleBot) {
    userAgent =
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    extraHTTPHeaders.push({
      name: "X-Forwarded-For",
      value: "66.249.66.1",
    });
  }
  const tab = await browser.newPage({
    viewport: { width: 2000, height: 10000 },
    userAgent: userAgent,
    extraHTTPHeaders: extraHTTPHeaders,
  });
  await tab.route(/.*/, (route) => {
    const routeUrl = route.request().url();
    const blockedDomains = Object.keys(blockedRegexes);
    const domain = matchUrlDomain(blockedDomains, routeUrl);
    if (domain && routeUrl.match(blockedRegexes[domain])) {
      return route.abort();
    }
    return route.continue();
  });

  await tab.addInitScript({
    path: "bypass-paywalls-chrome/src/js/contentScript.js",
  });
  await tab.addInitScript({ path: "utils/cosmeticFilter.js" });

  try {
    await tab.waitForTimeout(1000);
    await tab.goto(url, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await tab.waitForTimeout(5000);
    await fixRelativeLinks(tab, url);

    let [content, title] = ["", ""];
    let { author, publisher, authorType } = await tab.evaluate((url) => {
      const meta = {
        author: "",
        publisher: new URL(url).host,
        authorType: "",
      };

      const ogProps = document.querySelector('meta[property="og:site_name"]');
      const itemProps = document.querySelectorAll('[itemprop="author"]');
      const ldJsonTags = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );

      if (ogProps) {
        meta.author = ogProps && ogProps.content ? ogProps.content : "";
        meta.authorType = "og";
      }

      Array.from(itemProps).forEach((element) => {
        meta.publisher = meta.author;
        meta.author = element.innerText;
        meta.authorType = "ld";
      });

      Array.from(ldJsonTags).forEach((ldTag) => {
        try {
          const ld = JSON.parse(ldTag.innerHTML);
          if (ld["@type"] === "Article") {
            if (ld.author && ld.author["@type"] === "Person") {
              meta.author = ld.author.name;
              meta.authorType = "ld";
            }
            if (ld.publisher && ld.publisher["@type"] === "Organization") {
              meta.publisher = ld.publisher.name;
            }
          }
        } catch (e) {}
      });
      return meta;
    }, url);

    const readable = await buildReadableContent(tab, url);
    title = readable.title;
    content = readable.content;
    if (authorType !== "ld") {
      publisher = author;
      author = readable.byline;
    }

    const authorName = cleanHtmlText(
      [author, publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ")
    );

    const account = await telegraph.createAccount({
      author_name: authorName,
      author_url: url,
      short_name: (author || publisher || authorName).substring(0, 31),
    });

    const page = await telegraph.createPage(title, content, account);
    if (page) {
      return page.url;
    }
    throw new Error("no content");
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await tab.close();
    await browser.close();
  }
};
