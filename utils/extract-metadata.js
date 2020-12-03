const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const metascraper = require('metascraper')([
	require('metascraper-author')(),
	require('metascraper-date')(),
	require('metascraper-description')(),
	require('metascraper-image')(),
	require('metascraper-logo')(),
	require('metascraper-publisher')(),
	require('metascraper-title')(),
	require('metascraper-url')(),
	require('metascraper-readability')()
]);
// const { parse } = require("@postlight/mercury-parser");

module.exports.extractReadable = extractReadable;
module.exports.extractMetadata = extractMetadata;

async function extractReadable(html, url) {
	const doc = new JSDOM(html, { url });
	const reader = new Readability(doc.window.document);
	let readable = reader.parse();

	readable.textContent = undefined;
	readable.dir = undefined;
	readable.url = url;
	readable.meta = await extractMetadata(html, url);

	readable.author = readable.meta.author;
	readable.publisher = readable.meta.publisher;
	readable.byline = [readable.meta.author, readable.meta.publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ");

	return readable;
}

async function extractMetadata(html, url) {
	const dom = new JSDOM(html, { url });
	const document = dom.window.document;

	const metadata = await metascraper({ html, url });
	metadata.og = extractOpengraph(document);

	return metadata;
};

function extractOpengraph(document) {
	const props = document.querySelectorAll('meta[property^="og:"]');
	return Array.from(props).reduce((meta, prop) => ({
		...meta,
		[prop.attributes.getNamedItem('property').value]: prop.attributes.getNamedItem('content').value
	}), {})
}