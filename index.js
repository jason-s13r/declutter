const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const bypass = require('./utils/bypass');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/favicon.ico', async (req, res) => res.sendStatus(404));

app.post('/', async (req, res) => {
  try {
    const url = await bypass(req.body.url);
    if (req.body.redirect) {
      return res.redirect(url);
    }
  } catch (e) {
    if (e.message === 'Unsupported website') {
      res.status(400);
      return res.send(`<pre>Unsupported website.\nURL=${req.body.url}</pre>`);
    }
    console.error(e);
    return res.sendStatus(500);
  }
  return res.sendFile(path.join(__dirname, '/error.html'));
});

app.get('/', async (req, res) => {
  try {
    if (req.query.url) {
      return res.redirect(await bypass(req.query.url));
    }
  } catch (e) {
    if (e.message === 'Unsupported website') {
      res.status(400);
      return res.send(`<pre>Unsupported website.\nURL=${req.query.url}</pre>`);
    }
    return res.sendStatus(500);
  }
  return res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('*', async (req, res) => {
  const queryString = Object.keys(req.query)
    .map(k => `${k}=${req.query[k]}`)
    .join('&');

  const url = req.path.substring(1) + '?' + queryString;

  try {
    return res.redirect(await bypass(url));
  } catch (e) {
    if (e.message === 'Unsupported website') {
      res.status(400);
      return res.send(`<pre>Unsupported website.\nURL=${url}</pre>`);
    }
    return res.sendStatus(500);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
