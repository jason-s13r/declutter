const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const bypass = require('./utils/bypass');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  const url = await bypass(req.body.url);
  if (req.body.redirect) {
    return res.redirect(url);
  }
  return res.send(url);
});

app.get('/', async (req, res) => {
  if (req.query.url) {
    return res.redirect(await bypass(req.query.url));
  }
  return res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('*', async (req, res) => {
  const queryString = Object.keys(req.query)
    .map(k => `${k}=${req.query[k]}`)
    .join('&');

  const url = await bypass(req.path.substring(1) + '?' + queryString);
  return res.redirect(url);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
