const { JSDOM } = require("jsdom");

module.exports.extractMetadata = extractMetadata;
module.exports.cleanHtmlText = cleanHtmlText;
module.exports.addMetadata = addMetadata;

async function extractMetadata(tab, url) {
	return await tab.evaluate((url) => {
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
	}, url);
};

function cleanHtmlText(text) {
	const s = new JSDOM("").window.document.createElement("span");
	s.innerHTML = text;
	return s.textContent;
};

function addMetadata(readable, authorType, author, publisher, url) {
	if (authorType !== "ld") {
		publisher = author;
		author = readable.byline;
	}

	const authorName = cleanHtmlText(
		[author, publisher].filter((s) => !!s && !!s.trim()).join(" &bull; ")
	);

	readable.byline = authorName;
	readable.author = author;
	readable.publisher = publisher;
	readable.url = url;
	return readable;
}