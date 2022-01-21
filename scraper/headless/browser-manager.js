const { firefox } = require("playwright");

module.exports = {
  browserManager: init(),
};

function init() {
  let browser = null;

  async function initBrowser() {
    browser = await firefox.launch({
      args: [],
      headless: true,
      timeout: 60000,
    });

    browser.on("disconnected", async () => {
      await browser.close();
      initBrowser();
    });
    process.once("beforeExit", async () => {
      if (browser) {
        await browser.close();
      }
    });

    return browser;
  }

  async function getBrowser() {
    if (browser && browser.isConnected()) {
      return browser;
    }
    return initBrowser();
  }

  return {
    getBrowser,
  };
}
