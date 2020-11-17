const scraper = require("../../scraper/headless");
const cache = require('../../utils/cache');

module.exports = {
	getContent,
};

async function getContent(req, res) {
	const url = req.body.url;
	const nocache = !!req.body.nocache;
	if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
		return res.status(400);
	}
	console.log(`[headless/html] for url ${url}`);
	let page = cache.telegraph.get(url);
	let readable = cache.declutter.get(url);
	if (nocache) {
		page = undefined;
		readable = undefined;
		console.log('[headless/html] no cache');
	}
	console.log('[headless/html] have cached readable', !!readable);
	if (!readable) {
		console.log('[headless/html] doing a declutter');
		readable = await scraper.getDetails(url);
		cache.declutter.set(url, readable);
		console.log('[headless/html] have decluttered readable', !!readable);
	}
	if (!readable || !readable.content) {
		return res.status(500);
	}
	console.log('[headless/html] sent readable markup');
	return res.send(readable.content);
}