/**
Magos SERVER socket routes for game
*/

module.exports.listen = function(io, socket) {
	// on connection
	
	socket.on('get:game', function(slug, fn) {
		console.log('get:game');
		console.log(slug);
		fn(slug);
	});


};
