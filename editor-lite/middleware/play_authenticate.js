/**
* User authentication middleware for Magos.
*
* Note: User session data is created in Django app and stored in Redis.
*/

var _ = require('underscore')._,
	config = require("../config"),
	redis = require("redis"),
    redisClient = redis.createClient(config.redis.port, config.redis.ip),
	i18next = require('i18next');

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
	        'lang_code': json_data.lang_code,
	        'use_uppercase_text': json_data.use_uppercase_text,
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
	var session_id = req.cookies.sessionid;
	/*
	if(_.isUndefined(session_id)) {
		session_id = req.session.sessionid;
	}
	*/
	//if((_.isUndefined(req.cookies) || _.isUndefined(session_id) || _.isUndefined(req.cookies.csrftoken)) && !req.session.gameIsPublicForAll) {
	if((_.isUndefined(req.cookies) || _.isUndefined(session_id) || _.isUndefined(req.cookies.csrftoken))) {
	    // if no session exists
	    res.redirect(config.express.djangoUrl + '/game/login?next=/editor-lite' + req.url);
	    return false;
	}
	// query django session data from Redis
	redisClient.get('django_session:' + session_id, function(err, data) {
		if(!_.isNull(data)) {
			sessionUser = parseSessionObject(data);
			//console.log(sessionUser);
			if(_.has(sessionUser, 'userName')) {
				// anonymous can only play games
				req.session.user = sessionUser;
				req.session.isAuthenticated = true;
				i18next.setLng(sessionUser.lang_code, function(t) {
					next();
				});
			}
		}
	});
};
