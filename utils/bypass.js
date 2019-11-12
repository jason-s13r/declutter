module.exports = async (tab, url) => {
  if (!/^https?:\/\/(www.)?nzherald\.co\.nz/.test(url)) {
    return;
  }
  await tab.evaluate(() => {
    (function() {
      const selectors = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      ).flatMap(e => {
        const css_regex = /['"]cssSelector['"]:\ *['"]([\.\#]?-?[_a-zA-Z]+[_a-zA-Z0-9-]*)['"]/gi;
        const input = e.textContent.replace(/[\r\n]/g, "");
        const schemaInput = input.replace(/[\ ]/g, "");
        return (schemaInput.match(css_regex) || [])
          .map(n => {
            try {
              return JSON.parse(`{${n}}`);
            } catch (e) {
              return {};
            }
          })
          .map(n => n.cssSelector);
      });
      const content = document.querySelector(".premium-content");

      if (!selectors.length || !content) {
        return;
      }

      const inserted = content.parentElement.insertBefore(
        content.cloneNode(true),
        content
      );
      const [hidden, displayed] = [content, inserted];

      displayed.style.marginBottom = "75px";
      displayed.style.height = "unset";
      displayed.style.position = "unset";
      displayed.removeAttribute("id");
      displayed.classList.replace("premium-content", "full-content");
      selectors.forEach(s =>
        displayed.classList.remove(
          Array.from(displayed.classList).find(n => n.includes(s))
        )
      );
      Array.from(displayed.querySelectorAll(selectors.join(","))).forEach(e => {
        selectors.forEach(selector =>
          e.classList.remove(selector.substring(1))
        );
        e.style = "";
      });

      hidden.style.opacity = 0.1;
      hidden.style.height = "1px";
      hidden.style.overflow = "hidden";
    })();
  });
  if (await tab.$(".full-content .responsively-lazy:not(.loaded)")) {
    await tab.waitForSelector(".full-content .loaded", { timeout: 60000 });
  }
};
