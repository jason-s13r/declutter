window.addEventListener('DOMContentLoaded', function () {
	const elements = document.querySelectorAll('[data-srcset]');
	Array.from(elements, e => {
		const srcset = e.getAttribute('data-srcset');

		const set = srcset.split(',http').map(u => u.startsWith('http') ? u : `http${u}`);
		const src = set[set.length - 1].split(' ');

		e.setAttribute('src', src[0]);
		e.setAttribute('srcset', srcset);
	})
});

window.addEventListener('DOMContentLoaded', function () {
	const elements = document.querySelectorAll('img:not([src])');

	Array.from(elements, img => {
		const parent = img.parentNode;
		const itemprop = parent.getAttribute('itemprop');
		const itemtype = parent.getAttribute('itemtype');
		if (itemprop === 'image' && itemtype === 'http://schema.org/ImageObject') {
			const meta = img.parentNode.querySelector('meta[itemprop="url"]')
			if (meta) {
				img.src = meta.getAttribute('content');
			}
		}
	})
});

window.addEventListener('DOMContentLoaded', function () {
	const elements = document.querySelectorAll('img[src^="https://dynaimage.cdn.cnn.com"');

	Array.from(elements, e => {
		const src = e.getAttribute('src');
		const probably = src.split('/').reverse()[0];
		const url = new URL(decodeURIComponent(probably));
		e.setAttribute('lazy', src);
		if (url) {
			url.protocol = 'https';
			e.setAttribute('src', url.toString());
		}
	})
});