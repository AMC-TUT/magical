/**
* Editor routes
*/
var _ = require('underscore')._,
	config = require("../config"),
	i18next = require('i18next');

module.exports.getGame = function(req, res) {
  res.render('editor_get_game.html', {
    //user: req.user,
    title: 'MAGOS'
  })
};

module.exports.index = function(req, res) {
	var gameSlug = req.params.slug;
	var user = req.session.user;
	res.render('editor_index.html', {
		title: 'Magos Lite editor',
		djangoUrl: config.express.djangoUrl,
		user: user,
		lang: user.lang_code,
		gameSlug: gameSlug,
		roomId: req.params.roomId
	});
};
