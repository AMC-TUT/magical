/**
Magos SERVER socket routes for room
*/
var roomManager = require('../lib/room_manager_redis'),
	_ = require('underscore')._;


module.exports.listen = function(io, socket) {
	// on connection
	socket.on('join:room', function(gameSlug, user, fn) {
		console.log('join:room');
		roomManager.getOrCreate(gameSlug, function(data) {
			console.log(data);
			var room = data;
			if(room) {
				if (!_.isUndefined(user.role) && user.role === 'student') {
					// student = author
					console.log(user.userName + ' is an author');
					// remove current user first
					roomAuthors = _.reject(room.authors, function(el) { return el.userName === user.userName; });
					if(roomAuthors.length < 4) {
						// max 4 authors per room
						user.socketId = socket.id;
					 	roomAuthors.push(user);
					 	room.authors = roomAuthors;
						socket.join(gameSlug);
						roomManager.setRoom(gameSlug, JSON.stringify(room), function(err, reply) {
			                console.log('Room updated');
				            socket.broadcast.to(gameSlug).emit('author:joined:room', {
						        user: user,
		        				socketId: socket.id
		      				});
			            });
					} else {
						//room.full
						room = null;
					}
				} else if (!_.isUndefined(user.role) && user.role === 'teacher') {
					// teacher
				}
			}
			// return room data to callback function	
			fn(room);
		});
	});


};
