const express = require('express');
const bodyParser = require('body-parser');

const bypass = require('./utils/bypass');

const port = process.env.NODE_PORT || 3000;
const app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/', async (req, res, next) => {
  const url = await bypass(req.body.url);
  if (req.body.redirect) {
    res.redirect(url);
    return next();
  }
  res.send(url);
  return next();
});

app.get('/', async (req, res) => {
  res.send(`<html><body><pre>

  <form action="/" method="POST" accept-charset="UTF-8">
	  <input name="url" pattern="https:\/\/(www\.)?nzherald\.co\.nz/.*" />
	  <button type="submit">Get Link</button>
	  <button value="true" name="redirect" type="submit">Redirect</button>
	</form>
</pre></body></html>`);
});

app.get('*', async (req, res, next) => {
  const queryString = Object.keys(req.query)
    .map(k => `${k}=${req.query[k]}`)
    .join('&');

  const path = req.path.substring(1);
  const host = !/^https?:\/\/(www\.)?nzherald.co.nz/.test(path) ? 'https://www.nzherald.co.nz' : '';

  const url = await bypass(host + path + '?' + queryString);
  res.redirect(url);
  return next();
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
