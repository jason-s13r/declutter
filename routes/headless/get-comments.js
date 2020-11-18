const scraper = require("../../scraper/headless");
const cache = require('../../utils/cache');

module.exports = {
	getComments
};

async function getComments(req, res) {
	const url = req.body.url;
	const nocache = !!req.body.nocache;
	if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
		return res.status(400);
	}
	console.log(`[headless/comments] for url ${url}`);
	let comments = cache.comment.get(url);
	if (nocache) {
		comments = undefined;
		console.log('[headless/comments] no cache');
	}
	console.log('[headless/comments] have cached comments', !!comments);
	if (!comments) {
		console.log('[headless/comments] doing a disqus');
		comments = await scraper.getComments(url);
		cache.comment.set(url, comments);
		console.log('[headless/comments] have disqus comments', !!comments);
	}
	if (!comments) {
		return res.status(500);
	}
	console.log('[headless/comments] sent comments');
	return res.send(comments);
}