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

app.use('/', headless.router());
app.use('/headless', headless.router());
app.use('/simple', simple.router());


app.get('/_form', (_, res) => {
	const prefixes = ['', '/headless', '/simple'];
	const routes = ['/', '/telegraph', '/content', '/details', '/comments'];
	const html = prefixes.flatMap(p => routes.map(r => p + r))
		.map(route => `
	<form method="POST" action="${route}" accept-charset="UTF-8">
		<fieldset>
			<legend>route: POST ${route}</legend>
			<p><input name="url"/></p>
			<p><input type="checkbox" name="redirect" /> redirect?</p>
			<p><button type="submit">SUBMIT</button></p>
		</fieldset>
	</form>`).join('<hr />');
	res.send(html);
});

app.listen(port, () => console.log(`Declutter app listening on port ${port}!`));
