var express = require('express')

const { getTelegraphLink } = require('./get-telegraph-link');
const { getComments } = require('./get-comments');
const { getContent } = require('./get-content');
const { getDetails } = require('./get-details');
const { getLinkCodes } = require('./get-link-codes');

module.exports = {
	getComments,
	getContent,
	getDetails,
	getTelegraphLink,
	getLinkCodes,
	router
};

function router() {
	var router = express.Router()
	router.post("/", getTelegraphLink);
	router.post("/telegraph", getTelegraphLink);
	router.post("/content", getContent);
	router.post("/details", getDetails);
	router.post("/comments", getComments);
	router.post("/link-codes", getLinkCodes);
	return router;
};