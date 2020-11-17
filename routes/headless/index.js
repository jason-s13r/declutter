var express = require('express')

const { getTelegraphLink } = require('./get-telegraph-link');
const { getComments } = require('./get-comments');
const { getContent } = require('./get-content');
const { getDetails } = require('./get-details');

module.exports = {
	getComments,
	getContent,
	getDetails,
	getTelegraphLink,
	router
};

function router() {
	var router = express.Router()
	router.post("/", getTelegraphLink);
	router.post("/telegraph", getTelegraphLink);
	router.post("/content", getContent);
	router.post("/details", getDetails);
	router.post("/comments", getComments);
	return router;
};