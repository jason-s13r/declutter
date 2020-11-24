const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
// const { parse } = require("@postlight/mercury-parser");

module.exports.extractReadable = extractReadable;
module.exports.extractMetadata = extractMetadata;
module.exports.cleanHtmlText = cleanHtmlText;
module.exports.addMetadata = addMetadata;

async function extractReadable(html, url) {
	const doc = new JSDOM(html, { url });
	const reader = new Readability(doc.window.document);
	let readable = reader.parse();
	let { author, publisher, authorType } = extractMetadata(html, url)

	readable.url = url;
	readable = addMetadata(readable, authorType, author, publisher, url);
	return readable;
}

function extractMetadata(html, url) {
	const dom = new JSDOM(html, { url });
	const document = dom.window.document;

	const meta = {
		author: "",
		publisher: new URL(url).host,
		authorType: "",
	};

	const ogProps = document.querySelector('meta[property="og:site_name"]');
	const itemProps = document.querySelectorAll('[itemprop="author"]');
	const ldJsonTags = document.querySelectorAll(
		'script[type="application/ld+json"]'
	);

	if (ogProps) {
		meta.author = ogProps && ogProps.content ? ogProps.content : "";
		meta.authorType = "og";
	}

	Array.from(itemProps).forEach((element) => {
		meta.publisher = meta.author;
		meta.author = element.innerText;
		meta.authorType = "ld";
	});

	Array.from(ldJsonTags).forEach((ldTag) => {
		try {
			const ld = JSON.parse(ldTag.innerHTML);
			if (ld["@type"] === "Article") {
				if (ld.author && ld.author["@type"] === "Person") {
					meta.author = ld.author.name;
					meta.authorType = "ld";
				}
				if (ld.publisher && ld.publisher["@type"] === "Organization") {
					meta.publisher = ld.publisher.name;
				}
			}
		} catch (e) { }
	});
	return meta;
};

function cleanHtmlText(text) {
	const s = new JSDOM("").window.document.createElement("span");
	s.innerHTML = text;
	return s.textContent;
};

function addMetadata(readable, authorType, author, publisher) {
	if (authorType !== "ld") {
		publisher = author;
		author = readable.author || readable.byline;
	}

	const authorName = cleanHtmlText(
		[author, publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ")
	);

	readable.byline = authorName;
	readable.author = author;
	readable.publisher = publisher;
	return readable;
}