var config = require("../config"),
	redis = require("redis"),
	_ = require('underscore')._,
    redisClient = redis.createClient(config.redis.port, config.redis.ip);

// get or create (empty) room json for game
module.exports.getOrCreate = function(slug, callback) {
    getRoom(slug, function(data) {
		room = null;
        if(!_.isNull(data)) {
	    	console.log('Room found in Redis');
	    	room = JSON.parse(data);
    	} else {
            // create a new empty room
            console.log('Creating new room');
            var room = {
                slug: slug,
                authors: []
            };            
            setRoom(slug, JSON.stringify(room), function(data) {
                console.log('Room created!');
                console.log(data);
            });
    	}
    	callback(room);
  	});
};

function setRoom(slug, roomData, callback) {
    redisClient.set('lite-room:' + slug, roomData, function(err, data) {
        callback(data);
    });
}

function getRoom(slug, callback) {
    redisClient.get('lite-room:' + slug, function(err, reply) {
        callback(reply);
    });
}

function removeUserFromRoom(slug, socketId) {
    getRoom(slug, function(room) {
        if(room && room.authors) {
            console.log('Remove user from room.');
            roomAuthors = _.reject(room.authors, function(el) { return el.socketId === socketId; });
            room.authors = roomAuthors;
            setRoom(slug, room, function(data) {
                console.log('User removed from room!');
                console.log(data);
            });
        }
    });
}

function removeAllRooms() {
    // when starting Magos server, we have to remove all the rooms
    redisClient.keys("lite-room:*", function (err, keys) {
        keys.forEach(function (key, pos) {
            redisClient.del(key, function(err, o) {
                console.log('Room %s was removed', key);
            });
        });
    });
}

module.exports.setRoom = setRoom;
module.exports.getRoom = getRoom;
module.exports.removeUserFromRoom = removeUserFromRoom;
module.exports.removeAllRooms = removeAllRooms;
