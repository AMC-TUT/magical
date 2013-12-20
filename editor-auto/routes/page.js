/**
* Page routes
*/

module.exports.index = function(req, res) {
  res.render('index_view.html', {
    //user: req.user,
    title: 'MAGOS'
  })
};

module.exports.game = function(req, res) {
	var gameSlug = req.params.slug;
	console.log(req.params.slug);

	res.render('game_view.html', {
		user: req.user,
		gameSlug: gameSlug,
		roomId: req.params.roomId
	});
};
