const fetch = require('node-fetch');

const { getUserAgent } = require('../../utils/user-agent');
const { extractReadable } = require('../../utils/extract-metadata');

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
			throw response.statusText;
		}
		const html = await response.text();
		const readable = await extractReadable(html, url);
		return readable;
	} catch (e) {
		throw e;
	}
};
