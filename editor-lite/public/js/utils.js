
utils = {
	user: null,
	djangoUrl: null,
	apiUrl: null,
	apiUrl: null,
	apiBaseUrl: null,

	loadAudio: function() {
		var loading_msg = i18n.t("Loading audio...");
        $("#statusConsole").fadeIn().append( loading_msg );
        var self = this;
        var queue = new createjs.LoadQueue();
		createjs.Sound.alternateExtensions = ["ogg"];
        queue.installPlugin(createjs.Sound);
        queue.addEventListener("fileload", self.handleFileLoad);
        queue.addEventListener("complete", self.handleComplete);
        var audioQueue = [];
        _.each(gameSounds, function(val, key) {
			audioQueue.push( { id: key, src: val.src } );
		});
        queue.loadManifest(audioQueue);
	},

    handleFileLoad: function(event) {
        // console message
        $("#statusConsole").append('<br/>' + i18n.t("Loaded") + ':' + event.item.id );
    },

    handleComplete: function(event) {
        $("#statusConsole").append("<br/>" + i18n.t("Loading complete!") ).fadeOut(2000);
    },

    playSound: function(sound_name) {
        createjs.Sound.play(sound_name);
    },

	initAudio: function() {
		this.loadAudio();

	},

	i18nInit: function(lang_code, callback, scope) {
		lang_code = (!_.isUndefined(lang_code)) ? lang_code : 'en';
		i18n.init({
			lng: lang_code,
			resGetPath: '/editor-lite/static/i18n/__lng__/messages.magos.lite.json',
			fallbackLng: false
		}, function(t) {
            callback.call(scope);
		});
	},

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
	        		gameinfo.level1 = data.level1;
					gameinfo.state = data.state;		            
	        		var msg = '<p><img src="/editor-lite/static/img/magos-lite-logo-small.png" id="logo" /></p>';
	        		msg += '<h3>' + i18n.t("Welcome") + ' ' + editor.user.userName + '!</h3>';
	        		msg += '<p>' + i18n.t("You are editing game") + ' <b>' + data.level1.title + '</b></p>';
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
	        		gameinfo.level1 = data.level1;
	        		gameinfo.state = data.state;
		            callback.call(game); // have to use call(), otherwise this refers to Window
	        	}
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
		}
	},

	/* Get list of games where user is author */
	getUserGames: function(callback) {
		var self = this;
		if(self.user) {
	        var ajaxUrl = this.djangoUrl + this.apiBaseUrl + 'users_games/' + self.user.userName;
	        var ajaxReq = $.ajax({
	            dataType : 'json',
	            type : 'GET',
	            url : ajaxUrl
	        });
	        ajaxReq.done(function ( data, textStatus, jqXHR ) {
	            callback.call(editor, data.games);
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
		}

	},


	uppercaseAll: function() {
		$('body, button, select, input').css({ 'text-transform': 'uppercase'});
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
	},


	checkIfMobile: function() {
		var isMobile = {
		   Android: function() {
		       return navigator.userAgent.match(/Android/i);
		   },
		   BlackBerry: function() {
		       return navigator.userAgent.match(/BlackBerry/i);
		   },
		   iOS: function() {
		       return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		   },
		   Opera: function() {
		       return navigator.userAgent.match(/Opera Mini/i);
		   },
		   Windows: function() {
		       return navigator.userAgent.match(/IEMobile/i);
		   },
		   any: function() {
		    	if (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()) {
		    		return true;
		   		}
		   		return false;
		   }
		};
		isMobile = isMobile.any();
		return isMobile;
	},

	requestFullScreen: function() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}
	},

	toggleFullScreen: function() {
		if (!document.fullscreenElement &&    // alternative standard method
			!document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.cancelFullScreen) {
				document.cancelFullScreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		}
	}	

}
