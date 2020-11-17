const { JSDOM } = require("jsdom");
const domToNode = require("./dom-node");

const telegraph = require("../lib/telegraph");


module.exports.publishReadable = async (url, readable) => {
  const account = await telegraph.createAccount({
    author_name: readable.byline,
    author_url: url,
    short_name: (
      readable.author ||
      readable.publisher ||
      readable.byline
    ).substring(0, 31),
  });

  const dom = new JSDOM(`<html><body>${readable.content}</body></html>`);
  const div = dom.window.document.querySelector("body");
  const source = dom.window.document.createElement("p");
  source.innerHTML = `<a href="${url}"">${url}</a>`;
  div.prepend(source);
  const content = domToNode(div).children.filter((m) => {
    return !m.trim || m.trim().length > 0;
  });
  const page = await telegraph.createPage(readable.title, content, account);
  return page;
};
