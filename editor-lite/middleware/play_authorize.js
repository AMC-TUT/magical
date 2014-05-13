/**
* User authorization middleware for playing games in Magos.
*
* Note: User session data is created in Django app and stored in Redis.
*/

var _ = require('underscore')._,
	config = require("../config"),
	rest = require('restler'),
	redis = require("redis"),
    redisClient = redis.createClient(config.redis.port, config.redis.ip);


function base64Decode(encoded) {
	return new Buffer(encoded || '', 'base64').toString('utf8');
}

// parse base64 encoded Django session object to JSON
function parseSessionObject(data) {
  	var sessionUser = {},
      	json_data = {};
  	if(_.isString(data)) {
    	var enc = base64Decode(data);
	    try {
	      json_data = JSON.parse(enc);
	      sessionUser = {
	        'userName': json_data.username,
	        'lang': json_data.lang,
	        'role': json_data.role,
	        'org': json_data.organization,
	        'firstName': json_data.firstname,
	        'lastName': json_data.lastname
	      };
	      console.log(sessionUser);
	    } catch(e) {
	      console.log('There was an error when parsing session data. ' + e.message);
	    }
	}
	return sessionUser;
}


module.exports = function(req, res, next) {
	var gameSlug = req.params.slug;
	if(req.session.user && req.session.isAuthenticated && gameSlug) {
		rest.get(config.express.djangoUrl + '/api/v1/games/' + gameSlug).on('complete', function(result) {
		    var game = result;
	        var user = _.find(game.authors, function(author) { return author.userName === req.session.user.userName });
	        if(user || game.state == 2) {
				console.log('USER AUTHORIZED! %s', gameSlug);
				next();
			} else {
				console.log('UNAUTHORIZED USER! %s', gameSlug);
			    res.redirect('/');
			    return false;
			}
		});
	} else {
	    res.redirect(config.express.djangoUrl + 'game/login?next=' + req.url);
	    return false;
	}
};
