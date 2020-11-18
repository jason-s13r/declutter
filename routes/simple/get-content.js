const scraper = require("../../scraper/simple");

module.exports = {
	getContent,
};

async function getContent(req, res) {
	const url = req.body.url;
	if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
		return res.status(400);
	}
	console.log(`[simple/html] for url ${url}`);
	console.log('[simple/html] doing a declutter');
	const readable = await scraper.getDetails(url);
	console.log('[simple/html] have decluttered readable', !!readable);
	if (!readable || !readable.content) {
		return res.status(500);
	}
	console.log('[simple/html] sent readable markup');
	return res.send(readable.content);
}