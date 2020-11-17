const scraper = require("../../scraper/headless");
const cache = require('../../utils/cache');

module.exports = {
	getDetails,
};

async function getDetails(req, res) {
	const url = req.body.url;
	const nocache = !!req.body.nocache;
	if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
		return res.status(400);
	}
	let page = cache.telegraph.get(url);
	let readable = cache.declutter.get(url);
	if (nocache) {
		page = undefined;
		readable = undefined;
		console.log('[headless/details] no cache');
	}
	console.log('[headless/details] have cached readable', !!readable);
	if (!readable) {
		console.log('[headless/details] doing a declutter');
		readable = await scraper.getDetails(url);
		cache.declutter.set(url, readable);
		console.log('[headless/details] have decluttered readable', !!readable);
	}
	if (!readable) {
		return res.status(500);
	}
	console.log('[headless/details] sent readable');
	return res.send(readable);
}