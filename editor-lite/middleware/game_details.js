/**
* Game details middleware for Magos.
*/

var _ = require('underscore')._,
	config = require("../config"),
	rest = require('restler'),
	i18next = require('i18next');

module.exports = function(req, res, next) {
	// query game data from django api
	req.session.gameState = 0; // 0=private, 1=organization, 2=public
	var gameSlug = req.params.slug;
	rest.get(config.express.djangoUrl + '/api/v1/games/' + gameSlug).on('complete', function(result) {
	    var game = result;
	    req.session.gameState = game.state;
	    console.log(req.cookies.sessionid);
	  	if(game.state == 2) {
	    	if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
		    	rest.get(config.express.djangoUrl + '/api/v1/user/create/').on('complete', function(result) {
		    		if(result) {
		    			req.session.sessionid = result;
		    			console.log('SESSION CREATED', result);
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
