/**
* Editor routes
*/
var _ = require('underscore')._,
	config = require("../config");

module.exports.getGame = function(req, res) {
  res.render('editor_get_game.html', {
    //user: req.user,
    title: 'MAGOS'
  })
};

module.exports.index = function(req, res) {
	var gameSlug = req.params.slug;
	var user = req.session.user;
	console.log(config.express.djangoUrl);
	res.render('editor_index.html', {
		title: 'Magos Lite',
		djangoUrl: config.express.djangoUrl,
		user: user,
		gameSlug: gameSlug,
		roomId: req.params.roomId
	});
};
