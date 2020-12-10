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

	readable.author = readable.meta.author;
	readable.publisher = readable.meta.publisher;

	const byline = window.document.createElement('span');
	byline.innerHTML = [readable.meta.author, readable.meta.publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ");
	readable.byline = byline.textContent;

	const DOMPurify = createDOMPurify(new JSDOM('').window);

	readable.html = readable.content;
	readable.content = DOMPurify.sanitize(readable.html);
	readable.markdown = new Turndown().turndown(readable.content);

	return readable;
}

async function extractMetadata(html, url) {
	const { window } = new JSDOM(html, { url });

	const metadata = await metascraper({ html, url });
	metadata.og = extractOpengraph(window.document);
	try {
		metadata.videos = await extractVideos(url);
	} catch (e) {
		console.error(e);
	}

	return metadata;
};

async function extractVideos(url) {
	return new Promise((resolve, reject) => {
		const args = ['-j'];
		const opts = {};
		youtubedl.getInfo(url, args, opts, (e, o) => {
			if (e) {
				reject(e);
			}
			resolve(o instanceof Array ? o : [o]);
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