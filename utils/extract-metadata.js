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
	require('metascraper-readability')(),
	require('metascraper-media-provider')()
]);
const youtubedl = require('youtube-dl');
const Turndown = require('turndown');
const createDOMPurify = require('dompurify');

module.exports.extractReadable = extractReadable;
module.exports.extractMetadata = extractMetadata;

async function extractReadable(html, url) {
	const metadata = await extractMetadata(html, url);
	const { window } = new JSDOM(html, { url });

	if (metadata.videos) {
		replaceVideos(window, metadata.videos);
	}

	const reader = new Readability(window.document);
	let readable = reader.parse();

	readable.textContent = undefined;
	readable.dir = undefined;
	readable.url = url;
	readable.meta = metadata;
	readable.author = metadata.author;
	readable.publisher = metadata.publisher;

	const byline = window.document.createElement('span');
	byline.innerHTML = [metadata.author, metadata.publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ");
	readable.byline = byline.textContent;


	readable.html = readable.content;
	readable.content = cleanMarkup(readable.html, url);
	readable.markdown = new Turndown().turndown(readable.content);
	readable.meta.links = await extractLinks(readable.content, url);

	return readable;
}

function cleanMarkup(html, url) {
	const { window } = new JSDOM(`<html>${html}</html>`, { url });

	Array.from(window.document.querySelectorAll('*'), $e => {
		$e.getAttributeNames()
			.filter(a => /(^data-|^class$|^style$|^id$)/.test(a))
			.forEach(a => $e.removeAttribute(a));
	});
	Array.from(window.document.querySelectorAll('img,iframe'), $e => $e.setAttribute('loading', 'lazy'));
	Array.from(window.document.querySelectorAll(':not(input,meta,br,link,img,video,html)'))
		.reverse()
		.forEach($e => !$e.children.length && !$e.textContent && $e.remove());

	html = window.document.querySelector('html').innerHTML;
	const DOMPurify = createDOMPurify(window);
	return DOMPurify.sanitize(html);
}

async function extractMetadata(html, url) {
	const { window } = new JSDOM(html, { url });
	const metadata = await metascraper({ html, url });
	metadata.og = extractOpengraph(window.document);
	try {
		metadata.videos = await extractVideos(url);
	} catch (e) { }
	return metadata;
};

async function extractLinks(html, url) {
	const { window } = new JSDOM(html, { url });
	return Array
		.from(window.document.querySelectorAll('a'))
		.map($a => $a.href);
};

async function extractVideos(url) {
	return new Promise((resolve, reject) => {
		youtubedl.getInfo(url, [], {}, (e, o) => {
			if (e) {
				return reject(e);
			}
			return resolve(o instanceof Array ? o : [o]);
		});
	});
}

function replaceVideos(window, videos) {
	if (!videos) {
		return;
	}
	videos.forEach(info => {
		const id = info.id.replace(/(^ref\:)/, '');
		const $original = window.document.querySelector(`[data-video-id="${info.id}"],[data-video-id="${id}"],[id*="${info.id}"],[id*="${id}"]`)
		if (!$original) {
			return;
		}
		const $parent = $original.parentNode;
		const $fixed = window.document.createElement('figure');
		const $video = window.document.createElement('video');
		const $caption = window.document.createElement('figcaption');
		$video.src = info.url;
		$video.setAttribute('controls', 'controls');
		$video.setAttribute('title', info.title);
		$caption.textContent = info.description;
		$fixed.appendChild($video);
		$fixed.appendChild($caption);
		$parent.insertBefore($fixed, $original);
		$original.remove();
	});
}

function extractOpengraph(document) {
	const props = document.querySelectorAll('meta[property^="og:"]');
	return Array.from(props).reduce((meta, prop) => ({
		...meta,
		[prop.attributes.getNamedItem('property').value]: prop.attributes.getNamedItem('content').value
	}), {})
}