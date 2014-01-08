/**
* Editor routes
*/
var config = require("../config");

module.exports.index = function(req, res) {
	var gameSlug = req.params.slug;
	//var user = req.session.user;
	res.render('play_index.html', {
		title: 'Magos Lite',
		djangoUrl: config.express.djangoUrl,
		gameSlug: gameSlug
	});
};


