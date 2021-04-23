const express = require("express");
const bodyParser = require("body-parser");

const { telegraph } = require('./utils/cache');
const headless = require('./routes/headless');
const simple = require('./routes/simple');

const port = process.env.NODE_PORT || 33843;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/recent.json", async (_, res) => res.send(telegraph.keys().map((key) => telegraph.get(key))));

app.post('/', (req, res) => res.redirect(307, req.body.headless ? '/headless' : '/simple'));
app.use('/headless', headless.router());
app.use('/simple', simple.router());


app.get('/_form', (_, res) => {
	const routeHtml = route => `
	<form method="POST" action="${route}" accept-charset="UTF-8">
		<fieldset>
			<legend>route: POST ${route}</legend>
			<p><input name="url"/></p>
			<p><input type="checkbox" name="redirect" /> redirect?</p>
			<p><button type="submit">SUBMIT</button></p>
		</fieldset>
	</form>`;
	const prefixHtml = (prefix, routes) => `
	<fieldset style="display: inline-block; width: 500px; max-width: 100vw;">
		<legend>${prefix}</legend>
		<div>${routes}</div >
	</fieldset> `;
	const prefixes = ['', '/headless', '/simple'];
	const routes = ['/', '/telegraph', '/content', '/details', '/comments'];

	const html = prefixes.map(prefix => prefixHtml(prefix, routes.map(r => prefix + r).map(routeHtml).join('<hr />'))).join('');
	res.send(html);
});

app.listen(port, () => console.log(`Declutter app listening on port ${port} !`));
