const { googleBot, bingBot } = require('./constants');
const { matchUrlDomain, useGoogleBotSites, useBingBotSites } = require("./sites");

module.exports.getUserAgent = (url) => {
	const useGoogleBot = useGoogleBotSites.some(function (item) {
		return typeof item === "string" && matchUrlDomain(item, url);
	});
	const useBingBot = useBingBotSites.some(function (item) {
		return typeof item === "string" && matchUrlDomain(item, url);
	});

	if (useGoogleBot) {
		return {
			userAgent: googleBot.userAgent,
			headers: {
				"X-Forwarded-For": googleBot.ip
			}
		}
	}

	if (useBingBot) {
		return {
			userAgent: bingBot.userAgent,
			headers: {
				"X-Forwarded-For": bingBot.ip
			}
		}
	}

	return {
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0',
		headers: {}
	};
};