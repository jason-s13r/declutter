const scraper = require("../../scraper/simple");
const { publishReadable } = require("../../utils/publish-telegraph");

module.exports = {
	getTelegraphLink,
};

async function getTelegraphLink(req, res) {
	const url = req.body.url;
	const redirect = !!req.body.redirect;
	try {
		if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
			return res.status(400);
		}
		console.log('[simple/telegraph] doing a declutter');
		const readable = await scraper.getDetails(url);
		console.log('[simple/telegraph] have decluttered readable', !!readable);
		console.log('[simple/telegraph] doing a page');
		const page = await publishReadable(url, readable);
		console.log('[simple/telegraph] have created page', !!page);
		if (!page) {
			return res.status(500);
		}
		if (redirect) {
			console.log('[simple/telegraph] sent page redirect');
			return res.redirect(page.url);
		}
		console.log('[simple/telegraph] sent page url');
		return res.send(page.url);
	} catch (e) {
		if (/timeout/i.test(e.message)) {
			return res.status(504);
		}
		return res.status(500);
	}
}