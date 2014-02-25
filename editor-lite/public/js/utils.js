
utils = {
	djangoUrl: null,
	apiUrl: null,

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
	        		gameinfo['level1'] = data.level1;
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
	        		gameinfo['level1'] = data.level1;
		            callback.call(game); // have to use call(), otherwise this refers to Window
	        	}
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
	}


}
