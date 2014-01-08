/**
* Page routes
*/
var _ = require('underscore')._,
	config = require("../config");

module.exports.index = function(req, res) {
  res.render('index_view.html', {
    user: req.session.user,
    title: 'MAGOS'
  })
};
