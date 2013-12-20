var Magos = Magos || {};

Magos.core = {
	someVar: 10,
	
	init: function() {
		// init other modules
		Magos.sockets.init();
	},

	hi: function() {
		console.log('hi from core:' + this.someVar);
		Magos.models.magosRoles = "lasf";
		console.log(Magos.models.magosRoles);
	}
};

