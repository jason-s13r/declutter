const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const NodeCache = require("node-cache");

const declutter = require("./utils/declutter");
const { url } = require("inspector");

const port = process.env.NODE_PORT || 3000;
const app = express();
const cache = new NodeCache();

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
app.get("/", async (req, res) =>
  res.sendFile(path.join(__dirname, "/public/index.html"))
);

app.get("/keys", async (req, res) => {
  const pages = cache.keys().map((key) => cache.get(key));
  return res.send(pages);
});

app.post("/", async (req, res) => {
  const url = req.body.url;
  const redirect = !!req.body.redirect;
  try {
    if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
      return res.status(400);
    }
    let telegraph = cache.get(url);
    if (!telegraph) {
      telegraph = await declutter(url);
      cache.set(url, {
        author: telegraph.author,
        author_url: telegraph.author_url,
        description: telegraph.description,
        title: telegraph.title,
        url: telegraph.url,
      });
    }
    if (redirect) {
      return res.redirect(telegraph.url);
    }
    return res.send(telegraph.url);
  } catch (e) {
    if (/timeout/i.test(e.message)) {
      return res.status(504);
    }
    return res.status(500);
  }
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
