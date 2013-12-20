/**
Magos socket CLIENT module
*/

var Magos = Magos || {};

Magos.sockets = {
	socket: null,
	
	init: function() {
		// set up socket.io
		this.socket = io.connect();
		this.setupEvents();
	},

	/* -> Socket events from the server */
	setupEvents: function() {
		this.socket.on('init', this.onInit);
		//this.socket.on('getGame', this.onGetGame);
		this.socket.on('connecting', this.onConnecting);
		this.socket.on('connect', this.onConnect);
		this.socket.on('disconnecting', this.onDisonnecting);
		this.socket.on('disconnect', this.onDisconnect);
	},


	/** 
	* Socket requests to the server 
	*/
	initSocket: function() {
		this.socket.emit('init');
	},
	getGame: function(slug, callback) {
        this.socket.emit('get:game', slug, function(data) {
        	console.log(data);
        });
	},

	/* -> Socket events from the server */
	// 'init'
	onInit: function(data) {
		console.log(data.msg);
	},

	// 'connecting'
	onConnecting: function() {
		console.log('CONNECTING...');
	},

	// 'connect'
	onConnect: function() {
		console.log('CONNECTED!');
		console.log(Magos.sockets.socket.socket.sessionid);
	},

	// 'disconnecting'
	onDisconnecting: function() {
		console.log('DISCONNECTING...');
	},

	// 'disconnect'
	onDisconnect: function() {
		console.log('DISCONNECTED');
		console.log(Magos.sockets.socket.socket.sessionid);
	}

	/*
	onGetGame: function(data) {
		console.log('socket get game: ' + slug);
        this.socket.emit('getGame', slug, function(data) {
        	callback(data);
        	console.log(data);
        });
	}
	*/
};
