const scraper = require("../../scraper/simple");
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
	console.log(`[simple/details] for url ${url}`);
	let readable = cache.declutter.get(url);
	if (nocache) {
		readable = undefined;
		console.log('[simple/details] no cache');
	}
	console.log('[simple/details] have cached readable', !!readable);
	if (!readable) {
		console.log('[simple/details] doing a declutter');
		readable = await scraper.getDetails(url);
		cache.declutter.set(url, readable);
		console.log('[simple/details] have decluttered readable', !!readable);
	}
	if (!readable) {
		return res.status(500);
	}
	console.log('[simple/details] sent readable');
	return res.send(readable);
}