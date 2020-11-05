const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const NodeCache = require("node-cache");

const { declutter, telegraph } = require("./utils/declutter");
const { disqus } = require("./utils/disqus");

const MINUTE = 60;
const HOUR = 60 * MINUTE;

const port = process.env.NODE_PORT || 3000;
const app = express();
const cache = new NodeCache({ stdTTL: 24 * HOUR });
const declutter_cache = new NodeCache({ stdTTL: 30 * MINUTE });
const comment_cache = new NodeCache({ stdTTL: 30 * MINUTE });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/favicon.ico", async (req, res) => res.sendStatus(404));
app.get("/loading.svg", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/loading.svg"))
);
app.get("/style.css", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/style.css"))
);
app.get("/script.js", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/script.js"))
);
app.get("/keys.js", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/keys.js"))
);
app.get("/", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/index.html"))
);

app.get("/keys.json", async (req, res) => {
  const pages = cache.keys().map((key) => cache.get(key));
  return res.send(pages);
});

app.post("/", async (req, res) => {
  const url = req.body.url;
  const redirect = !!req.body.redirect;
  const nocache = !!req.body.nocache;
  try {
    if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
      return res.status(400);
    }
    let page = cache.get(url);
    let readable = declutter_cache.get(url);
    if (nocache) {
      page = undefined;
      readable = undefined;
      console.log('[simple] no cache');
    }
    console.log('[simple] have cached page', !!page);
    if (!page) {
      console.log('[simple] have cached readable', !!readable);
      if (!readable) {
        console.log('[simple] doing a declutter');
        readable = await declutter(url);
        declutter_cache.set(url, readable);
        console.log('[simple] have decluttered readable', !!readable);
      }
      console.log('[simple] doing a page');
      page = await telegraph(url, readable);
      console.log('[simple] have created page', !!page);
      if (page) {
        cache.set(url, {
          author: page.author,
          author_url: page.author_url,
          description: page.description,
          title: page.title,
          url: page.url,
        });
      }
    }
    if (!page) {
      return res.status(500);
    }
    if (redirect) {
      console.log('[simple] sent page redirect');
      return res.redirect(page.url);
    }
    console.log('[simple] sent page url');
    return res.send(page.url);
  } catch (e) {
    if (/timeout/i.test(e.message)) {
      return res.status(504);
    }
    return res.status(500);
  }
});

app.post("/details", async (req, res) => {
  const url = req.body.url;
  const nocache = !!req.body.nocache;
  if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
    return res.status(400);
  }
  let page = cache.get(url);
  let readable = declutter_cache.get(url);
  if (nocache) {
    page = undefined;
    readable = undefined;
    console.log('[details] no cache');
  }
  console.log('[details] have cached readable', !!readable);
  if (!readable) {
    console.log('[details] doing a declutter');
    readable = await declutter(url);
    declutter_cache.set(url, readable);
    console.log('[details] have decluttered readable', !!readable);
  }
  if (!readable) {
    return res.status(500);
  }
  console.log('[details] sent readable');
  return res.send(readable);
});



app.post("/comments", async (req, res) => {
  const url = req.body.url;
  const nocache = !!req.body.nocache;
  if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
    return res.status(400);
  }
  let comments = comment_cache.get(url);
  if (nocache) {
    comments = undefined;
    console.log('[comments] no cache');
  }
  console.log('[comments] have cached comments', !!comments);
  if (!comments) {
    console.log('[comments] doing a disqus');
    comments = await disqus(url);
    comment_cache.set(url, comments);
    console.log('[comments] have disqus comments', !!comments);
  }
  if (!comments) {
    return res.status(500);
  }
  console.log('[comments] sent comments');
  return res.send(comments);
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
