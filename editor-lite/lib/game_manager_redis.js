var config = require("../config"),
	redis = require("redis"),
	_ = require('underscore')._,
    redisClient = redis.createClient(config.redis.port, config.redis.ip);


function getGame(slug, callback) {
    redisClient.get('lite-game:' + slug, function(err, data) {
        var game = JSON.parse(data);
        callback(game);
    });
}

function setGame(slug, gameData, callback) {
    redisClient.set('lite-game:' + slug, gameData, function(err, data) {
        callback(data);
    });
}

function getGameComponents(slug, callback) {
	getGame(slug, function(game) {
        if(!_.isNull(game)) {
        	console.log(game);
        	var gameComponents = game.gameComponents;
        	callback(gameComponents);
        }
        callback(false);
    });
}


module.exports.getGame = getGame;
module.exports.setGame = setGame;
module.exports.getGameComponents = getGameComponents;
