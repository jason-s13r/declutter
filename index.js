const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const NodeCache = require("node-cache");

const declutter = require("./utils/declutter");

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
      cache.set(url, telegraph);
    }
    if (redirect) {
      return res.redirect(telegraph);
    }
    return res.send(telegraph);
  } catch (e) {
    if (/timeout/i.test(e.message)) {
      return res.status(504);
    }
    return res.status(500);
  }
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
