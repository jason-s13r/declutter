const { JSDOM } = require("jsdom");

const { browserManager } = require('./browser-manager');
const { getUserAgent } = require('../../utils/user-agent');
const { disqusThread } = require('../../utils/disqus-thread');

const DISQUS_EMBED = 'https://disqus.com/embed/comments/';

module.exports.getComments = async (url) => {
	const { userAgent, headers } = getUserAgent(url);

	const browser = await browserManager.getBrowser();
	const context = await browser.newContext();
	const tab = await context.newPage({
		extraHTTPHeaders: headers,
		userAgent,
		viewport: { width: 2000, height: 10000 },
	});

	try {
		await tab.goto(url, { timeout: 60000, waitUntil: "domcontentloaded" });

		const response = await tab.waitForResponse(response => response.url().includes(DISQUS_EMBED));
		const text = await response.text();
		const dom = new JSDOM(text, response.url());
		const script = dom.window.document.querySelector('#disqus-threadData')
		const data = JSON.parse(script.innerHTML);

		return disqusThread(data);
	} catch (e) {
		throw e;
	} finally {
		await tab.close();
		await context.close();
	}
};