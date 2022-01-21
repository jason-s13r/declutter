const scraper = require("../../scraper/headless");
const cache = require("../../utils/cache");

module.exports = {
  getLinkCodes,
};

async function getLinkCodes(req, res) {
  const url = req.body.url;
	const nocache = !!req.body.nocache;
  if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
    return res.status(400);
  }
  console.log(`[headless/link-codes] for url ${url}`);
  let machine = cache.linkCodes.get(url);
  if (nocache) {
    machine = undefined;
    console.log("[headless/link-codes] no cache...");
  }
  if (!machine) {
    console.log("[headless/link-codes] vending machine goes brrr...");
    machine = await scraper.getLinkCodes(url);
    cache.linkCodes.set(url, machine);
  }
  if (!machine) {
    return res.status(500);
  }
  return res.send(machine);
}
