const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const declutter = require('./utils/declutter');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/favicon.ico', async (req, res) => res.sendStatus(404));
app.get('/loading.svg', async (req, res) => res.sendFile(path.join(__dirname, '/loading.svg')));

app.post('/', async (req, res) => {
  try {
    const url = await declutter(req.body.url);
    if (req.body.redirect) {
      return res.redirect(url);
    }
    return res.send(url);
  } catch (e) {
    switch (e.message) {
      case 'Unsupported website':
        return res.sendStatus(400);
    }
    console.error(e.message);
    return res.sendStatus(500);
  }
});

app.get('/', async (req, res) => {
  try {
    if (req.query.url) {
      return res.redirect(await declutter(req.query.url));
    }
  } catch (e) {
    switch (e.message) {
      case 'Unsupported website':
        return res.sendStatus(400);
    }
    console.error(e.message);
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
    return res.redirect(await declutter(url));
  } catch (e) {
    switch (e.message) {
      case 'Unsupported website':
        return res.sendStatus(400);
    }
    console.error(e.message);
    return res.sendStatus(500);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
