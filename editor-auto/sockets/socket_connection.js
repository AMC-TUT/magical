/**
Magos SERVER socket routes for handling connection
*/

module.exports.listen = function(io, socket) {
	// on connection
	console.log('socket client connected: ' + socket.id);

	socket.on('init', function() {
		socket.emit('init',{msg:"test"});		
	});

	socket.on('disconnect', function(){
		console.log('socket client disconnected: ' + socket.id);
	});

};
