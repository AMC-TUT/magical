/**
* Game details middleware for Magos.
*/

var _ = require('underscore')._,
	config = require("../config"),
	rest = require('restler'),
	i18next = require('i18next');

module.exports = function(req, res, next) {
	// query game data from django api
	var gameSlug = req.params.slug;
	rest.get(config.express.djangoUrl + '/api/v1/games/' + gameSlug).on('complete', function(result) {
	    var game = result;
	  	if(game.state == 2) {
		    config.game.publicForAll = true;
	    	if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
		    	rest.get(config.express.djangoUrl + '/api/v1/user/create/').on('complete', function(result) {
		    		if(result) {
		    			req.session.sessionid = result;
						//res.cookie('sessionid', 'result');
		    		}
					next();
				});
			} else {
				next();
			}
	  	} else {
			next();
	  	}
	});


};
