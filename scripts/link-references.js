window.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    fixRelativeLinks();
    getLinkCodes();
  }, 500);
});

function fixRelativeLinks() {
  const { host, protocol } = window.location;
  const url = `${protocol}//${host}`;
  [
    ['[src^="/"]', "src"],
    ['[href^="/"]', "href"],
  ].forEach(([selector, attribute]) => {
    Array.from(document.querySelectorAll(selector))
      .filter(
        (e) =>
          e.attributes[attribute] &&
          /^\/[^\/]/.test(e.attributes[attribute].value)
      )
      .forEach((e) => {
        e.attributes[
          attribute
        ].value = `${url}${e.attributes[attribute].value}`;
      });
  });
}

function getLinkCodes() {
  const seen = [];
  const links = Array.from(document.querySelectorAll("a")).filter((link) => {
    if (link.href && !seen.includes(link.href)) {
      seen.push(link.href);
      return true;
    }
    return false;
  });

  links.forEach((link, index) => {
    const key = index.toString(16).toUpperCase().padStart(2, "0");
    link.dataset.vendingMachine = key;
  });

  const css = `
[data-vending-machine]:after {
  content: attr(data-vending-machine);
  background: #fff;
  border: solid 2px #000;
  color: #000;
  font-weight: bold;
  font-size: 1.2em;
  z-index: 20;
  margin-left: 5px;
}`;

  const style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(document.createTextNode(css));

  document.querySelector("body").appendChild(style);

  window.linkMap = links.reduce((map, link) => {
    const key = link.dataset.vendingMachine;
    map[key] = link.href;
    return map;
  }, {});
}
