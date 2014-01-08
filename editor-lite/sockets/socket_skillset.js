/**
Magos SERVER socket routes for skillsets (Magoses)
*/
var skillsetManager = require('../lib/skillset_manager');


module.exports.listen = function(io, socket) {
	// on connection
	socket.on('get:skillsets', function(callback) {
		console.log('get:skillsets');
		skillsetManager.getSkillsets(function(data) {
			console.log(data);
			// return skillset data to callback function
			callback(data);
		});
	});

};