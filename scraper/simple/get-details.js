const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const { getUserAgent } = require('../../utils/user-agent');
const { addMetadata, extractMetadata } = require('../../utils/extract-metadata');

module.exports.getDetails = async (url) => {
	try {
		const { userAgent, headers } = getUserAgent(url);
		const response = await fetch(url, {
			headers: {
				...headers,
				'User-Agent': userAgent
			}
		});
		if (!response.ok) {
			return res.sendStatus(response.statusCode);
		}
		const html = await response.text();
		const doc = new JSDOM(html, { url });
		const reader = new Readability(doc.window.document);
		let readable = reader.parse();
		let { author, publisher, authorType } = extractMetadata(html, url)

		readable = addMetadata(readable, authorType, author, publisher, url);

		return readable;
	} catch (e) {
		throw e;
	}
};
