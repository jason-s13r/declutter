const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const declutter = require('./utils/declutter');
const getStreamUrl = require('./utils/stream');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/favicon.ico', async (req, res) => res.sendStatus(404));
app.get('/loading.svg', async (req, res) => res.sendFile(path.join(__dirname, '/public/loading.svg')));
app.get('/style.css', async (req, res) => res.sendFile(path.join(__dirname, '/public/style.css')));
app.get('/script.js', async (req, res) => res.sendFile(path.join(__dirname, '/public/script.js')));
app.get('/watch.js', async (req, res) => res.sendFile(path.join(__dirname, '/public/watch.js')));
app.get('/watch', async (req, res) => res.sendFile(path.join(__dirname, '/public/watch.html')));
app.get('/', async (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));

app.post('/', async (req, res) => {
  const url = req.body.url;
  const redirect = !!req.body.redirect;
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
});

app.post('/watch', async (req, res) => {
  const url = req.body.url;
  try {
    const stream = await getStreamUrl(url);
    return res.send(stream);
  } catch (e) {
    if (/timeout/i.test(e.message)) {
      return res.status(504);
    }
    console.error(e);
    return res.status(500);
  }
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
