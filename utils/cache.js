const NodeCache = require("node-cache");

const MINUTE = 60;
const HOUR = 60 * MINUTE;

const telegraph = new NodeCache({ stdTTL: 24 * HOUR });
const declutter = new NodeCache({ stdTTL: 4 * HOUR });
const comment = new NodeCache({ stdTTL: 30 * MINUTE });

module.exports = {
	telegraph,
	declutter,
	comment
};