/**
* User authentication middleware for Magos.
*
* Note: User session data is created in Django app and stored in Redis.
*/

var _ = require('underscore')._,
	config = require("../config"),
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
	    } catch(e) {
	      console.log('There was an error when parsing session data. ' + e.message);
	    }
	}
	return sessionUser;
}


module.exports = function(req, res, next) {
	req.session.user = null;
	req.session.isAuthenticated = null;
	var isAuthenticated = false;
	var sessionUser = null;
	if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
	    // if no session exists
	    res.redirect(config.express.djangoUrl + 'game/login?next=' + req.url);
	    return false;
	}
	// query django session data from Redis
	redisClient.get('django_session:' + req.cookies.sessionid, function(err, data) {
		if(!_.isNull(data)) {
			sessionUser = parseSessionObject(data);
			if(_.has(sessionUser, 'userName')) {
				if(sessionUser.role != 'player' && sessionUser.userName != 'anonymous') {
					// anonymous players can not use Magos editor
					isAuthenticated = true;
					req.session.user = sessionUser;
					req.session.isAuthenticated = true;
					next();					
				}
			}
		}
		// if not authenticated user, redirect to login
		if(!isAuthenticated) {
		    res.redirect(config.express.djangoUrl + 'game/login?next=' + req.url);
		    return false;
		}
	});
};
