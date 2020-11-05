const { JSDOM } = require("jsdom");
const { firefox } = require("playwright");
const {
	blockedRegexes,
	matchUrlDomain,
	useGoogleBotSites,
} = require("./sites");

const disqusThread = data => {
	const comments = data.response.posts.reduce((c, post) => ({
		...c,
		[post.id.toString()]: {
			author: post.author.name,
			authorLink: post.author.profileUrl,
			date: post.createdAt,
			text: post.raw_message,
			score: post.points,
			children: [],
			id: post.id.toString(),
			parent: (post.parent || '').toString(),
		}
	}), {});
	Object.keys(comments).filter(id => !!comments[id].parent).forEach(id => {
		const comment = comments[id];
		comments[comment.parent].children.push(comment);
	});
	const parents = Object.keys(comments).filter(id => comments[id].parent).map(id => comments[id]);
	return parents;
};

module.exports.disqus = async (url) => {
	const browser = await firefox.launch({
		args: [],
		executablePath: process.env.DECLUTTER_BROWSER_PATH || undefined,
		headless: true,
	});

	// override User-Agent to use Googlebot
	const useGoogleBot = useGoogleBotSites.some(function (item) {
		return typeof item === "string" && matchUrlDomain(item, url);
	});

	let userAgent = undefined;
	let extraHTTPHeaders = undefined;
	if (useGoogleBot) {
		userAgent =
			"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
		extraHTTPHeaders = { "X-Forwarded-For": "66.249.66.1" };
	}
	const tab = await browser.newPage({
		viewport: { width: 2000, height: 10000 },
		userAgent,
		extraHTTPHeaders,
	});

	try {
		await tab.goto(url, {
			timeout: 60000,
			waitUntil: "domcontentloaded",
		});

		const response = await tab.waitForResponse(response => response.url().includes('https://disqus.com/embed/comments/'));
		const text = await response.text();
		const dom = new JSDOM(text, response.url());
		const script = dom.window.document.querySelector('#disqus-threadData')
		const data = JSON.parse(script.innerHTML);

		return disqusThread(data);
	} catch (e) {
		console.error(e);
		throw e;
	} finally {
		await tab.close();
		await browser.close();
	}
};