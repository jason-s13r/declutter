const scraper = require("../../scraper/simple");
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
	console.log(`[simple/html] for url ${url}`);
	let readable = cache.declutter.get(url);
	if (nocache) {
		readable = undefined;
		console.log('[simple/html] no cache');
	}
	console.log('[simple/html] have cached readable', !!readable);
	if (!readable) {
		console.log('[simple/html] doing a declutter');
		readable = await scraper.getDetails(url);
		cache.declutter.set(url, readable);
		console.log('[simple/html] have decluttered readable', !!readable);
	}
	if (!readable || !readable.content) {
		return res.status(500);
	}
	console.log('[simple/html] sent readable markup');
	return res.send(readable.content);
}