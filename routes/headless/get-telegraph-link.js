const scraper = require("../../scraper/headless");
const { publishReadable } = require("../../utils/publish-telegraph");
const cache = require('../../utils/cache');

module.exports = {
	getTelegraphLink,
};

async function getTelegraphLink(req, res) {
	const url = req.body.url;
	const redirect = !!req.body.redirect;
	const nocache = !!req.body.nocache;
	try {
		if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
			return res.status(400);
		}
		let page = cache.telegraph.get(url);
		let readable = cache.declutter.get(url);
		if (nocache) {
			page = undefined;
			readable = undefined;
			console.log('[headless/telegraph] no cache');
		}
		console.log('[headless/telegraph] have cached page', !!page);
		if (!page) {
			console.log('[headless/telegraph] have cached readable', !!readable);
			if (!readable) {
				console.log('[headless/telegraph] doing a declutter');
				readable = await scraper.getDetails(url);
				cache.declutter.set(url, readable);
				console.log('[headless/telegraph] have decluttered readable', !!readable);
			}
			console.log('[headless/telegraph] doing a page');
			page = await publishReadable(url, readable);
			console.log('[headless/telegraph] have created page', !!page);
			if (page) {
				cache.telegraph.set(url, {
					author: page.author,
					author_url: page.author_url,
					description: page.description,
					title: page.title,
					url: page.url,
				});
			}
		}
		if (!page) {
			return res.status(500);
		}
		if (redirect) {
			console.log('[headless/telegraph] sent page redirect');
			return res.redirect(page.url);
		}
		console.log('[headless/telegraph] sent page url');
		return res.send(page.url);
	} catch (e) {
		if (/timeout/i.test(e.message)) {
			return res.status(504);
		}
		return res.status(500);
	}
}