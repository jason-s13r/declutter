const googleBotUserAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const googleBotIp = '66.249.66.1';
const bingBotUserAgent = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';

module.exports.googleBot = {
	userAgent: googleBotUserAgent,
	ip: googleBotIp,
	headers: {
		'User-Agent': googleBotUserAgent,
		'X-Forwarded-For': googleBotIp,
	}
}

module.exports.bingBot = {
	userAgent: bingBotUserAgent,
	ip: undefined,
	headers: {
		'User-Agent': bingBotUserAgent,
		'X-Forwarded-For': undefined,
	}
}