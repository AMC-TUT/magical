
utils = {
	djangoUrl: null,
	apiUrl: null,

	/* Get latest game revision for editing */
	getGameToEdit: function(gameSlug, callback) {
		var self = this;
		if(gameSlug) {
	        var ajaxUrl = this.djangoUrl + this.apiUrl + gameSlug;
	        var ajaxReq = $.ajax({
	            dataType : 'json',
	            type : 'GET',
	            url : ajaxUrl
	        });
	        ajaxReq.done(function ( data, textStatus, jqXHR ) {
	        	if(data.level1) {
	        		gameinfo['level1'] = data.level1;
	        		var msg = '<p><img src="/editor-lite/static/img/magos-lite-logo-small.png" id="logo" /></p>';
	        		msg += '<h3>Welcome ' + editor.user.userName + '!</h3>';
	        		msg += '<p>You are editing game <b>' + data.level1.title + '</b></p>';
	        		msg += '<p>&nbsp;</p>';
	        		utils.notify(msg, 'success', 1800);
		            callback.call(editor); // have to use call(), otherwise this refers to Window
	        	}
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
		}
	},

	/* Get latest game revision for playing */
	getGameToPlay: function(gameSlug, callback) {
		var self = this;
		if(gameSlug) {
	        var ajaxUrl = this.djangoUrl + this.apiUrl + gameSlug;
	        var ajaxReq = $.ajax({
	            dataType : 'json',
	            type : 'GET',
	            url : ajaxUrl
	        });
	        ajaxReq.done(function ( data, textStatus, jqXHR ) {
	        	if(data.level1) {
	        		gameinfo['level1'] = data.level1;
	        		/*
	        		var msg = '<p><img src="/editor-lite/static/img/magos-lite-logo-small.png" id="logo" /></p>';
	        		msg += '<h3>' + data.level1.title + '</h3>';
	        		msg += '<p>Welcome to play!</p>';
	        		msg += '<p>&nbsp;</p>';
	        		utils.notify(msg, 'success', 1800);
		            */
		            callback.call(game); // have to use call(), otherwise this refers to Window
	        	}
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
		}
	},

	/**
	 * Display flash notifications
	 */
	notify: function(msg, msgType, msgTimeout) {
		if(_.isUndefined(msgTimeout)) msgTimeout = 600;
		// show notification
		var note = noty({
			text: msg, 
			type: msgType || 'alert',
			timeout: msgTimeout
		});
	}


}
