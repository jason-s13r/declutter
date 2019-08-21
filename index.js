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

app.get('/', async (req, res) => {
  return res.sendFile(path.join(__dirname, '/index.html'));
});

const declutterRequest = async (res, url, redirect) => {
  try {
    const telegraph = await declutter(url);
    if (redirect) {
      return res.redirect(telegraph);
    }
    return res.send(telegraph);
  } catch (e) {
    switch (e.message) {
      case 'Unsupported website':
        return res.sendStatus(400);
    }
    console.error(e.message);
    return res.sendStatus(500);
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
