//var _ = require('underscore')._;

function getGame(req, res) {
  //res.render('listGames', { title: 'Games' });


  res.send("respond with a resource");
}


function setup(app) {
  //app.param('slug', /[a-zA-Z0-9-]+$/);
  app.get('/game/list', getGame);
  //app.get('/edit/:slug', edit);
}

module.exports = setup;

