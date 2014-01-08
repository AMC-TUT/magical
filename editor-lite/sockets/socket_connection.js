/**
Magos SERVER socket routes for handling connection
*/
var roomManager = require('../lib/room_manager_redis'),
	_ = require('underscore')._;


module.exports.listen = function(io, socket) {
	// on connection
	console.log('socket client connected: ' + socket.id);

	socket.on('init', function() {
		socket.emit('init',{msg:"test"});
	});

	socket.on('disconnect', function() {
		console.log('socket client disconnected: ' + socket.id);
		// remove from every room socket is part of
		//console.log(io.sockets.manager.roomClients[socket.id]);
		_.each(io.sockets.manager.roomClients[socket.id], function( val, key ) {
			if(!_.isEmpty(key)) {
				var gameSlug = key.substring(1);
				roomManager.removeUserFromRoom(gameSlug, socket.id);
				socket.leave(gameSlug);
			}
		});
	});

};
