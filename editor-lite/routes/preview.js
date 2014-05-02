/**
* Play routes
*/
var _ = require('underscore')._,
	config = require("../config");

module.exports.index = function(req, res) {
	var gameSlug = req.params.slug;
	var user = req.session.user;
	res.render('play_index.html', {
		title: 'Magos Lite',
		djangoUrl: config.express.djangoUrl,
		user: user,
		lang: user.lang_code,
		gameSlug: gameSlug,
		preview: true
	});
};