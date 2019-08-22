const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const declutter = require('./utils/declutter');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/favicon.ico', async (req, res) => res.sendStatus(404));
app.get('/loading.svg', async (req, res) => res.sendFile(path.join(__dirname, '/public/loading.svg')));
app.get('/style.css', async (req, res) => res.sendFile(path.join(__dirname, '/public/style.css')));
app.get('/script.js', async (req, res) => res.sendFile(path.join(__dirname, '/public/script.js')));
app.get('/', async (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));

const declutterRequest = async (res, url, redirect) => {
  try {
    if (!/https?:\/\/(www\.)?.*\/.*/i.test(url)) {
      return res.status(400);
    }
    const telegraph = await declutter(url);
    if (redirect) {
      return res.redirect(telegraph);
    }
    return res.send(telegraph);
  } catch (e) {
    if (/timeout/i.test(e.message)) {
      return res.status(504);
    }
    console.error(e);
    return res.status(500);
  }
};

app.post('/', async (req, res) => await declutterRequest(res, req.body.url, !!req.body.redirect));

app.get('*', async (req, res) => {
  const queryString = Object.keys(req.query)
    .map(k => `${k}=${req.query[k]}`)
    .join('&');

  const url = req.path.substring(1) + '?' + queryString;

  return await declutterRequest(res, url, false);
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
