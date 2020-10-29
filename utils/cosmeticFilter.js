(function () {
  if (matchDomain("stuff.co.nz")) {
    removeSelectors([
      ".support-brief-container",
      ".donation-in-story-container-top",
      ".sics-component__sharebar",
      ".breaking-news-pointer",
      ".bigbyline-container",
      [
        ".sics-component__html-injector.sics-component__story__paragraph",
        "READ MORE:",
      ],
    ]);
  } else if (matchDomain("nzherald.co.nz")) {
    removeSelectors([
      "[href$='#commenting-widget']",
      ".related-articles",
      ".article__print-button",
      ".share-bar",
      ".c-suggest-links.read-more-links",
      ".website-of-year",
    ]);
  } else if (matchDomain(["rnz.co.nz", "radionz.co.nz"])) {
    removeSelectors([".c-advert-app", ".c-sub-nav"]);
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

  function removeSelectors(selectors) {
    window.setTimeout(function () {
      const elements = selectors.flatMap((s) => {
        if (typeof s === "string") {
          return Array.from(document.querySelectorAll(s));
        } else if (s && s.constructor.name === "Array") {
          return pageContains(...s);
        }
        return undefined;
      });
      removeDOMElement(...elements);
    }, 1000);
  }
})();
