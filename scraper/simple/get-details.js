const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Script, createContext } = require("vm");
const { readFile } = require('fs');

const { getUserAgent } = require('../../utils/user-agent');
const { extractReadable } = require('../../utils/extract-metadata');

async function runScript(filename, context) {
	try {
		return await new Promise((resolve, reject) => {
			readFile(filename, {}, (e, content) => {
				if (e) {
					reject(e);
				}
				const script = new Script(content, { filename: `(internal):${filename}` })
				script.runInContext(context);
				resolve(context);
			});
		})
	} catch (e) {
		console.error(e);
	}
	return context;
}

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

		const original = await response.text();
		const { window } = new JSDOM(original, { url });
		window.window = window;
		window.setTimeout = cb => cb();
		window.setInterval = cb => cb();
		const context = createContext(window);

		await runScript('vendor/bypass-paywalls-chrome/src/js/contentScript.js', context);
		await runScript('scripts/lazyload.js', context);
		await runScript('scripts/cosmetic-filter.js', context);
		await runScript('scripts/fix-relative-links.js', context);

		const script = new Script(`window.dispatchEvent(new window.Event('DOMContentLoaded'));`);
		script.runInContext(context);
		const html = context.document.querySelector('html').innerHTML;

		const readable = await extractReadable(html, url);

		response.original = original;

		return readable;
	} catch (e) {
		throw e;
	}
};
