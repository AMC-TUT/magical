/**
Magos SERVER socket routes for game
*/
var gameManager = require('../lib/game_manager_redis'),
	_ = require('underscore')._;

module.exports.listen = function(io, socket) {
	// on connection

	/** 
	 * Get the whole game data
	 */
	socket.on('get:game', function(slug, fn) {
		console.log('get:game');
		console.log(slug);
		gameManager.getGame(slug, function(data) {
			console.log(data);
			// return game data to callback function
			fn(data);
		});
	});

	/** 
	 * Get game components
	 */
	socket.on('get:gamecomponents', function(slug, fn) {
		console.log('get:gamecomponents');
		console.log(slug);
		gameManager.getGameComponents(slug, function(data) {
			console.log(data);
			// return game component data to callback function
			fn(data);
		});
	});


	/** 
	 * Set game components
	 */
	socket.on('set:gamecomponents', function(gameSlug, gameComponents, fn) {
		console.log('set:gamecomponents');		
		socket.broadcast.to(gameSlug).emit('gamecomponents:set', gameComponents);
		gameManager.getGame(gameSlug, function(data) {
			data.gameComponents = gameComponents;
			gameManager.setGame(gameSlug, JSON.stringify(data), function(data) {
				console.log('Game data updated');
				fn(true);
			});
		});
	});


	/** 
	 * Remove game component
	 */
	socket.on('remove:gamecomponent', function(gameSlug, gameComponent, fn) {
		console.log('remove:gamecomponent');
		socket.broadcast.to(gameSlug).emit('gamecomponent:remove', gameComponent);
		gameManager.getGame(gameSlug, function(data) {
			var gameComponents = _.reject(data.gameComponents, function(el) { return el.slug === gameComponent.slug; });
			data.gameComponents = gameComponents;
			gameManager.setGame(gameSlug, JSON.stringify(data), function(data) {
				console.log('Game data updated');
				fn(true);
			});
		});
	});


	/** 
	 * Component was added to game canvas
	 */
	socket.on('show:canvascomponent', function(gameSlug, gameComponent, fn) {
		console.log('show:canvascomponent');
		console.log(gameComponent);
		socket.broadcast.to(gameSlug).emit('canvascomponent:show', gameComponent);
		gameManager.getGame(gameSlug, function(data) {
			data.revision.scenes[1].gameComponents.push(gameComponent);
			gameManager.setGame(gameSlug, JSON.stringify(data), function(data) {
				console.log('Game data updated');
				fn(true);
			});
		});		
	});

	/** 
	 * Component was removed from game canvas
	 */
	socket.on('remove:canvascomponent', function(gameSlug, canvasComponent, fn) {
		console.log('remove:canvascomponent');
		//console.log(gameComponent);
		socket.broadcast.to(gameSlug).emit('canvascomponent:remove', canvasComponent);
		gameManager.getGame(gameSlug, function(data) {
			var canvasComponents = _.reject(data.revision.scenes[1].gameComponents, function(el) { return el.oid === canvasComponent.oid; });
			data.revision.scenes[1].gameComponents = canvasComponents;
			gameManager.setGame(gameSlug, JSON.stringify(data), function(data) {
				console.log('Game data updated');
				fn(true);
			});
		});
	});

};
