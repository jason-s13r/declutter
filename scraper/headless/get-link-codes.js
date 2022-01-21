const crypto = require("crypto");

const { browserManager } = require("./browser-manager");
const { getUserAgent } = require("../../utils/user-agent");
// const { blockedRegexes, matchUrlDomain } = require("../../utils/sites");
// const { extractReadable } = require("../../utils/extract-metadata");

module.exports.getLinkCodes = async (url) => {
  const key = crypto.createHash("sha256").update(url).digest("hex");
  const { userAgent, headers } = getUserAgent(url);

  const browser = await browserManager.getBrowser();
  const context = await browser.newContext({
    screen: { width: 1024, height: 10 * 768 },
    viewport: { width: 1024, height: 10 * 768 },
  });
  const tab = await context.newPage({
    extraHTTPHeaders: headers,
    userAgent,
    viewport: { width: 1024, height: 10 * 768 },
  });

  try {
    // await tab.addInitScript({ path: "vendor/bypass-paywalls-chrome/src/js/contentScript.js" });
    // await tab.addInitScript({ path: "scripts/cosmetic-filter.js" });
    await tab.addInitScript({ path: "scripts/fix-relative-links.js" });
    await tab.addInitScript({ path: "scripts/link-references.js" });
    await tab.goto(url, { timeout: 60000, waitUntil: "domcontentloaded" });
    await tab.waitForTimeout(3000);

    const links = await tab.evaluate(() => {
      const $links = document.querySelectorAll("[data-vending-machine]");
      const linkMap = Array.from($links).reduce((map, link) => {
        const key = link.dataset.vendingMachine;
        map[key] = link.href;
        return map;
      }, {});
      return linkMap;
    });
    const buffer = await tab.screenshot();
    const image = buffer.toString("base64");

    return {
      key,
      url,
      image,
      links,
    };
  } catch (e) {
    throw e;
  } finally {
    await tab.close();
    await context.close();
  }
};
