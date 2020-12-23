window.addEventListener("DOMContentLoaded", function () {
  removeHiddenElements();

  if (matchDomain("stuff.co.nz")) {
    removeSelectors([
      ".support-brief-container",
      '[class*="donation-in-"]',
      ".sics-component__sharebar",
      ".breaking-news-pointer",
      ".bigbyline-container",
      ".sics-component__story-video .sics-component__caption",
      ".sics-component__caption__top-line",
      [
        ".sics-component__html-injector.sics-component__story__paragraph",
        "READ MORE:",
      ],
    ]);
  }
  if (matchDomain("nzherald.co.nz")) {
    removeSelectors([
      "[href$='#commenting-widget']",
      ".related-articles",
      ".article__print-button",
      ".share-bar",
      ".c-suggest-links.read-more-links",
      ".website-of-year",
      ".meta-data",
      ".article__kicker",
      ".author__image",
      '.video-outer + figcaption',
      '[alt="Subscribe to Premium"]',
      ["p > strong", "READ MORE:"],
    ]);
  }
  if (matchDomain(["rnz.co.nz", "radionz.co.nz"])) {
    removeSelectors([".c-advert-app", ".c-sub-nav"]);
    Array.from(document.querySelectorAll('div.photo-captioned'), $element => {
      const $img = $element.querySelector('img');
      if (!$img) {
        return;
      }
      const $caption = $element.querySelector('.caption');
      const figure = document.createElement('figure');
      const figcaption = document.createElement('figcaption');
      figcaption.innerHTML = $caption.innerHTML;
      figure.appendChild($img);
      figure.appendChild(figcaption);
      $element.parentElement.insertBefore(figure, $element);
      $element.remove();
    });
  }
  if (matchDomain(["newsroom.co.nz"])) {
    removeSelectors([".article_content__section", ".bio"]);
  }
  if (matchDomain(["newshub.co.nz"])) {
    removeSelectors([
      ".c-ArticleHeading-authorPicture",
      '.c-ArticlePublisher img',
      ".relatedarticles",
      ".ArticleAttribution",
      ".GlobalFooter",
    ]);
  }
  if (matchDomain(["tvnz.co.nz"])) {
    removeSelectors([
      ".story-footer",
      ".story-social-share-col",
      ".story-related-tags",
      ".signup-container",
      ".signup-image",
      ".signup-content",
    ]);
  }
  if (matchDomain(["thespinoff.co.nz"])) {
    removeSelectors([
      ".the-spinoff-club-interruptive",
      ".bulletin-signup",
      ".addthis_sharing_toolbox",
      "#sponsor_post_footer",
    ]);
  }
  if (matchDomain(["odt.co.nz"])) {
    removeSelectors([
      ".breadcrumb-wrapper",
      '[class*="presspatron-message"]',
    ]);
  }

  function matchDomain(domains) {
    const hostname = window.location.hostname;
    if (typeof domains === "string") {
      domains = [domains];
    }
    return domains.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );
  }

  function removeDOMElement(...elements) {
    for (const element of elements) {
      if (element) {
        element.remove();
      }
    }
  }

  function pageContains(selector, text) {
    const elements = document.querySelectorAll(selector);
    return Array.prototype.filter.call(elements, function (element) {
      return RegExp(text).test(element.textContent);
    });
  }

  function removeHiddenElements() {
    window.setTimeout(function () {
      const selector = "*:not(script):not(head):not(meta):not(link):not(style)";
      Array.from(document.querySelectorAll(selector))
        .filter((element) => {
          const computed = getComputedStyle(element);
          const displayNone = computed["display"] === "none";
          const visibilityHidden = computed["visibility"] === "hidden";
          return displayNone || visibilityHidden;
        })
        .forEach((element) => element && element.remove());
    }, 1500);
  }

  function removeSelectors(selectors) {
    window.setTimeout(function () {
      const elements = selectors.flatMap((s) => {
        if (typeof s === "string") {
          return Array.from(document.querySelectorAll(s));
        }
        if (s && s.constructor.name === "Array") {
          return pageContains(...s);
        }
        return undefined;
      });
      removeDOMElement(...elements);
    }, 500);
  }
});
