const scraper = require("../../scraper/headless");
const cache = require("../../utils/cache");

module.exports = {
  getLinkCodes,
};

async function getLinkCodes(req, res) {
  const url = req.body.url;
  if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
    return res.status(400);
  }
  console.log("[headless/link-codes] vending machine goes brrr...");
  const machine = await scraper.getLinkCodes(url);
  if (!machine) {
    return res.status(500);
  }
  return res.send(machine);
}
