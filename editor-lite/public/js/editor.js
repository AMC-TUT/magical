var gameinfo = {
	"level1":{
		title: "Game is not named.", 
		instructions:"No instructions are given.", 
		platformType: "air",
		playerImg: "magos-girl",
		itemInterval:4000,
		hazardInterval:4000,
		wordInterval: 4000,
		sky: null, 
		scroll:[ 
			{item:null, speed:5}, 
			{item:null, speed:10},
			{item:null, speed:15}
		],
		collectables:[], 
		hazards:[], 
		powerups:[],
		wordRules:[],
		answers:[],
		fractionRules:[],
		matchRule:null,
		gameMode: "time", 
		gameDuration: 60,
		goalDistance: 400,
		survivalFactor: 0.95,
		extraLife: false,
		turboSpeed: false,
		bgcolor: "#F2F2F2",
		star3limit: 0,
		star2limit: 0,
		star1limit: 0,
		memoryIncrease: 0,
		memoryStart: 0,
		matchPointsRight: 0,
		matchPointsWrong: 0,
		hazardEffect: 0,
		sliceAmount: 0,
		pieceAmount: 0,
		pizzaRules:[],
		jumpPower: -24,
		bonustimelimit: 220
	}
}

var designFeedback = "";
var elementCouter = 0;
var taskLabel;

function generateFeedback() {
	var parent=document.getElementById("feedbackTxt");
	parent.removeChild(parent.childNodes[0]);	
	var node=document.createTextNode(designFeedback);
	node.id = "feedback"; 
	parent.appendChild(node);
}

function showWarning(warning){
	var parent=document.getElementById("matchWarning").innerHTML=warning;
}

var editor = {
	djangoUrl: 'http://localhost:8080',
	apiUrl: '/api/v1/games/',
	user: null,
	initial: true,
	gameSlug: null,
	mediaLoader: null,
	fontGame: null,
	playerDead: null,
	score: null,
	level: null,

	stars: null,
	mistakes: null,
	plantInterval: null,
	fishInterval: null,
	avoidInterval: null,

	coinAmount: null,
	storable: null,
	startTime: null,
	endTime: null,

	// variables for editor
	p1: null,
	p2: null,
	p3: null,
	player: null,
	sky: null,
	p1_speed: null,
	p2_speed: null,
	p3_speed: null,

	playerImg: null,
	gravity: null,
	ymov: null,
	itemInterval: null,
	bgcolor: null,
	
	instructions: null,
	title: null,

	p1y: null,
	p2y: null,
	p3y: null,
	collectables: null,
	//avoidables: null,
	hazards: null,
	powerUps: null,
	gameMode: "normal",
	maxFractionNumber: 5,

	/* Get latest game revision */
	getGame: function(gameSlug, callback) {
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
	        		var msg = '<p><img src="/editor-lite/static/img/magos-logo-small.png" id="logo" /></p>';
	        		msg += '<h3>Welcome ' + editor.user.userName + '!</h3>';
	        		msg += '<p>You are editing game <b>' + data.level1.title + '</b></p>';
	        		msg += '<p>&nbsp;</p>';
	        		editor.notify(msg, 'success', 1800);
		            callback.call(editor); // have to use call(), otherwise this refers to Window
	        	}
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
		}
	},

	/* Update game revision */
	setGame: function(callback) {
		var self = this;
		if(editor.gameSlug) {
		    var ajaxUrl = this.djangoUrl + this.apiUrl + editor.gameSlug;
	        var ajaxReq = $.ajax({
	            type: 'PUT',
	            data: {
	            	'revision': JSON.stringify(gameinfo.level1),
		            'state': 1 // 1 = private, 2 = public
	            },
	            url: ajaxUrl
	        });
	        ajaxReq.done(function ( data, textStatus, jqXHR ) {
	        	editor.notify("Game saved", 'success');       	
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
	    }
	},

	init: function() {
		if(this.gameSlug) {
			this.getGame(this.gameSlug, this.initEditor);
		}
	},

	initEditor: function() {
		Crafty.init(1024, 748);
		this.mediaLoader = new MediaLoader();
		this.fontGame = {font: 'Arial', size: 24, color: '#FF0000'};
		this.playerDead = false;
		this.score = 0;
		this.level = 1;
		this.stars;
		this.mistakes = 0;
		this.fishInterval;
		this.avoidInterval;
		this.coinAmount=0;
		this.storable=false;
		this.startTime;
		this.endTime;
		this.p1 = null;
		this.p2 = null;
		this.p3 = null;
		this.player = null;
		this.sky = null;
		this.p1_speed = null;
		this.p2_speed = null;
		this.p3_speed = null;
		this.playerImg;
		this.gravity;
		this.ymov;
		this.itemInterval;
		this.instructions="";
		this.title="jee";
		this.p1y = 578;
		this.p2y = 478;
		this.p3y = 378;
		this.collectables = [];
		this.hazards = [];
		this.powerUps = [];
		this.gameMode = "normal";
		
		
		// ###### PRELOAD ############## Preload all media used by the game and the selected level
		Crafty.scene('preload', function() {
			Crafty.e('Text2').setStyle(editor.fontGame).text('Loading...');
			editor.mediaLoader.addImages(textures);
			editor.mediaLoader.addSounds(sounds);
			//mediaLoader.addSprites(sprites);
			editor.mediaLoader.load(function(success) {
				if(success) {
					//editor.checkLocalStoreSupport();
					Crafty.scene('editor');
					var query_string = QueryStringToJSON();
					//taskMode = query_string.taskmode;	
				}
			});
		});

		// ###### EDITOR ############## Preload all media used by the game and the selected level
		Crafty.scene('editor', function() {
			Crafty.background(gameinfo["level1"].bgcolor);
			editor.getGameData();
			Crafty.e("2D, DOM, Image, itemhelp").attr({x: 420, y: 30, z: 1000});
			Crafty.e("2D, DOM, Image, playerhelp").attr({x: 100, y: 150, z: 1000});
			Crafty.e("2D, DOM, Image, scroll1").attr({y: editor.p1y, z: 1});
			Crafty.e("2D, DOM, Image, scroll2").attr({y: editor.p2y, z: 1});
			Crafty.e("2D, DOM, Image, scroll3").attr({y: editor.p3y, z: 1});
			Crafty.e("2D, DOM, Image, heart").attr({x: 30, y: 10, z: 1100});
			
			editor.createMissingErefs(gameinfo.level1.wordRules);			

			// create predefined UI elements
			editor.createUIElements();
			editor.updateFormValues();
			if(editor.initial) {
				editor.bindUiFormSubmits();
				editor.bindUIElementChanges();
				editor.bindUIClicks();
			}
			editor.initial = false;
		});
		Crafty.scene('preload');
	},

	updateFormValues: function() {
		// platform type
		if(gameinfo.level1.platformType) {
			$('select#platformList').val(gameinfo.level1.platformType);
		}
		if(gameinfo.level1.jumpPower) {
			$('select#jumpList').val(gameinfo.level1.jumpPower);
		}
		// game mode
		if(gameinfo.level1.gameMode) {
			$('select#modeList').val(gameinfo.level1.gameMode);
		}
		if(gameinfo.level1.gameDuration) {
			$('select#gameDurationList').val(gameinfo.level1.gameDuration);
		}

		if(gameinfo.level1.goalDistance == 0) gameinfo.level1.goalDistance = 400;
		$('select#distanceList').val(gameinfo.level1.goalDistance);

		if(gameinfo.level1.survivalFactor) {
			$('select#survivalList').val(gameinfo.level1.survivalFactor);
		}
		
		// match
		if(gameinfo.level1.matchRule) {
			$('select#matchList').val(gameinfo.level1.matchRule);
		} else {
			$('select#matchList').val('-1');
		}

		// matching rule memory start
		
		if(gameinfo["level1"].memoryStart) {
			$('input#memoryStart').val( parseInt(gameinfo["level1"].memoryStart) );
		}
		// matching rule memory increment
		if(gameinfo["level1"].memoryIncrease) {
			$('input#memoryIncrease').val( parseInt(gameinfo["level1"].memoryIncrease) );
		}

		//gameinfo["level1"].memoryIncrease = parseInt(increment);


		// player
		if(gameinfo.level1.playerImg) {
			$('select#playerList').val(gameinfo.level1.playerImg);
		}

		// background
		if(gameinfo.level1.sky) {
			$('select#skyList').val(gameinfo.level1.sky);
		}
		if(gameinfo.level1.scroll[2]) {
			$('select#p3List').val(gameinfo.level1.scroll[2].item);
		}
		if(gameinfo.level1.scroll[1]) {
			$('select#p2List').val(gameinfo.level1.scroll[1].item);
		}
		if(gameinfo.level1.scroll[0]) {
			$('select#p1List').val(gameinfo.level1.scroll[0].item);
		}

		if(gameinfo.level1.bgcolor) {
			$('select#colorList').val(gameinfo.level1.bgcolor);
		}


		if(gameinfo.level1.itemInterval) {
			$('select#itemIntervalList').val(gameinfo.level1.itemInterval);
		}
		if(gameinfo.level1.hazardInterval) {
			$('select#hazardIntervalList').val(gameinfo.level1.hazardInterval);
		}
		if(gameinfo.level1.hazardEffect) {
			$('select#hazardEffectList').val(gameinfo.level1.hazardEffect);
		}

		// points
		if(gameinfo.level1.matchPointsRight) {
			$('select#matchRightList').val(gameinfo.level1.matchPointsRight);
		}
		if(gameinfo.level1.matchPointsWrong) {
			$('select#matchWrongList').val(gameinfo.level1.matchPointsWrong);
		}

	},

	createUIElements: function() {
		editor.definePlatformType();
		// game mode
		if(gameinfo.level1.gameMode) {
			// open mode related settings
			editor.getMode(gameinfo.level1.gameMode);
		}
		// match type
		editor.getMatchType(gameinfo.level1.matchRule);

		// player
		if(gameinfo.level1.playerImg) {
			editor.changePlayerImg(gameinfo.level1.playerImg);
		}
		// background
		if(gameinfo.level1.bgcolor) {
    		editor.changeBgColor();			
		}
		if(gameinfo.level1.sky) {
    		editor.changeSkyImg();
		}
		if(gameinfo.level1.scroll[2]) {
    		editor.changeP3Img();
		}
		if(gameinfo.level1.scroll[1]) {
    		editor.changeP2Img();
		}
		if(gameinfo.level1.scroll[0]) {
    		editor.changeP1Img();
		}

		// collectables
		if(gameinfo.level1.collectables) {
			$('#collect-drop').empty();
			_.each(gameinfo.level1.collectables, function(collectable, index, list) {
				editor.getCollectable(collectable, false);
			});
			editor.updateCollectiblesView();
		}
		// hazards
		if(gameinfo.level1.hazards) {
			$('#avoid-drop').empty();
			_.each(gameinfo.level1.hazards, function(hazard, index, list) {
				editor.getHazard(hazard, false);
			});
			editor.updateHazardsView();
		}
		// word rules
		if(gameinfo.level1.wordRules) {
			$('#matching').empty();
			_.each(gameinfo.level1.wordRules, function(wordRule, index, list) {
				editor.addMatchRule(wordRule, false);
			});
		}

		// fraction rules
		if(gameinfo.level1.fractionRules) {
			$('#fractionTasks').empty();
			_.each(gameinfo.level1.fractionRules, function(fractionRule, index, list) {
				editor.addFractionTask(fractionRule, false);
			});
		}

	},

	bindUiFormSubmits: function() {
		// add word match rule
		$('form#addMatchRule').submit(function(e) {
			e.preventDefault();
			$('#matchWarning').empty();
			var w1 = $("#word1").val(),
				w2 = $("#word2").val(),
				w3 = $("#word3").val();

			var wAnswers = w3.split(",");
			var index = w3.length;
			if(wAnswers[index-1] == "" || wAnswers[index-1] == " "){
				w3.pop();
			}

    		if(w1!="" && w2!="" && w1!=" " && w2!=" ") {
    			var matchRules = {
    				'task': w1,
    				'right': w2,
    				'wrongArr': wAnswers,
	 				'eref': editor.guid() // uuid
    			}
    			editor.addMatchRule(matchRules, true);
				editor.setGame();
    		} else {
				showWarning("Either a task or an answer is missing!");
    		}
		});

		$('#fractionTaskForm').submit(function(e) {
			e.preventDefault();
			$('#matchWarning').empty();
			var denominator = parseInt($("input#fractionDenominatorVal").val(), 10),
				numerator = parseInt($("input#fractionNumeratorVal").val(), 10);
			if (denominator == 0) {
				showWarning("Denominator can not be null!");
			} else {
	    		if(denominator >= numerator) {
	    			var fractionRule = {
	    				'denominator': denominator,
	    				'numerator': numerator,
		 				'eref': editor.guid() // uuid
	    			}
	    			editor.addFractionTask(fractionRule, true);
	    		} else {
					showWarning("Denominator has to be equal or greater than numerator!");
	    		}
			}


		});
	},

	bindUIClicks: function() {
		// remove match rule
		editor.bindRemoveMatchRule();
		// remove fraction task
		editor.bindRemoveFractionTask();

		// fraction change numerator
		$('.changeNumerator').click(function(e) {
			var action = $(this).val();
			editor.changeNumerator(action);
		});
		// fraction change denominator
		$('.changeDenominator').click(function(e) {
			var action = $(this).val();
			editor.changeDenominator(action);
		});

	},

	bindUIElementChanges: function() {
		// platform type
		$('select#platformList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.platformType = valueSelected;
    		editor.definePlatformType(valueSelected, editor.setGame);
		});
		$('select#jumpList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.jumpPower = parseInt(valueSelected, 10);
    		editor.setGame();
		});
		$('select#modeList').change(function() {
    		var valueSelected = this.value;
    		editor.getMode(valueSelected);
    		editor.setGame();
		});

		$('select#survivalList').change(function() {
    		var valueSelected = this.value;
    		editor.getSurvivalValues(parseFloat(valueSelected));
    		editor.setGame();
		});
		$('select#gameDurationList').change(function() {
    		var valueSelected = this.value;
    		editor.getGameDuration(parseInt(valueSelected, 10));
    		editor.setGame();
		});
		$('select#distanceList').change(function() {
    		var valueSelected = this.value;
    		editor.getGoalDistance(parseInt(valueSelected, 10));
    		editor.setGame();
		});		

		// match
		$('select#matchList').change(function() {
    		var valueSelected = this.value;
    		editor.getMatchType(valueSelected);
    		editor.setGame();
		});
		
		// player image
		$('select#playerList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.playerImg = valueSelected;
    		editor.setGame();
    		editor.changePlayerImg(valueSelected);
		});

		// Background
		// background color
		$('select#colorList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.bgcolor = valueSelected;
    		editor.setGame();
    		editor.changeBgColor(valueSelected);
		});
		// static background element
		$('select#skyList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.sky = valueSelected;
    		editor.setGame();
    		editor.changeSkyImg(valueSelected);
		});
		// scrolling background 3
		$('select#p3List').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.scroll[2] = {item: valueSelected, speed:editor.p3_speed};
    		editor.setGame();
    		editor.changeP3Img(valueSelected);
		});
		// scrolling background 2
		$('select#p2List').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.scroll[1] = {item: valueSelected, speed:editor.p2_speed};
    		editor.setGame();
    		editor.changeP2Img(valueSelected);
		});
		// scrolling background 1
		$('select#p1List').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.scroll[0] = {item: valueSelected, speed:editor.p1_speed};
    		editor.setGame();
    		editor.changeP1Img(valueSelected);
		});

		// collectables
		$('select#collectList').change(function() {
			var optionSelected = $("option:selected", this);
    		var valueSelected = this.value;
			if(valueSelected != '') {
				var collectable = {
	 				speed: "average", 
	 				eref: editor.guid(), // uuid
	 				score: 0,
	 				type: valueSelected,
	 				name: valueSelected
	    		};
				editor.getCollectable(collectable, true);
				editor.updateCollectiblesView();
			}
		});

		// hazards
		$('select#avoidList').change(function() {
			var optionSelected = $("option:selected", this);
    		var valueSelected = this.value;
			if(valueSelected != '') {		
				var hazard = {
	 				speed: "average", 
	 				eref: editor.guid(), // uuid
	 				score: 0,
	 				type: valueSelected,
	 				name: valueSelected
	    		};
				editor.getHazard(hazard, true);
				editor.updateHazardsView();
			}
		});
		// appearance interval of collectibles
		$('select#itemIntervalList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.itemInterval = valueSelected;
    		editor.setGame();
		});
		// appearance interval of hazards
		$('select#hazardIntervalList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.hazardInterval = valueSelected;
    		editor.setGame();
		});
		// appearance interval of hazards
		$('select#hazardEffectList').change(function() {
    		var valueSelected = this.value;
    		gameinfo.level1.hazardEffect = valueSelected;
    		editor.setGame();
		});

	},
	
	populateSelect: function(selectId, optionsData, selectedVal) {
		$(selectId).empty();
		_.each(optionsData, function(option, index, list) {
			var optionEl = $('<option>');
			$(optionEl).val(option.value).text(option.text);
			if(option.value == selectedVal) $(optionEl).attr('selected', 'selected');
            $(selectId).append(optionEl);
		});
	},
	
	updateItemsView: function(items, xPos, yStart) {
		_.each(items, function(item, index, list) {
			Crafty(item.eref).each(function(i) {
				this.destroy();
			});
			Crafty.e("2D, DOM, Image, " + item.type + ", " + item.eref).attr({x: xPos, y: yStart + index * 100, z: 10});
		});
	},

	updateCollectiblesView: function() {
		editor.updateItemsView(gameinfo.level1.collectables, 450, 100);
	},

	updateHazardsView: function() {
		editor.updateItemsView(gameinfo.level1.hazards, 600, 100);
	},


	updateEditorView: function() {
		editor.updateCollectiblesView();
		editor.updateHazardsView();
		editor.changePlayerImg();
	},
	
	test: function() {
	
	},

	localToEditor: function(obj) {
		// Retrieve the object from storage
		var retrievedObject = localStorage.getItem(obj);
		return retrievedObject;
	},

	getGameData: function(){
		this.title = gameinfo["level1"].title;
		this.instructions = gameinfo["level1"].instructions;
		this.playerImg = gameinfo["level1"].playerImg;
		this.sky = gameinfo["level1"].sky;
		this.itemInterval = gameinfo["level1"].itemInterval;
		
		this.p1 = gameinfo["level1"].scroll[0].item;
		this.p2 = gameinfo["level1"].scroll[1].item;
		this.p3 = gameinfo["level1"].scroll[2].item;
		this.p1_speed = gameinfo["level1"].scroll[0].speed;
		this.p2_speed = gameinfo["level1"].scroll[1].speed;
		this.p3_speed =gameinfo["level1"].scroll[2].speed;
		
		for(var i; i<gameinfo["level1"].collectables.length; i++){
			this.collectables.push(gameinfo[curlevel].collectables[i].type);
		}
		for(var j; j<gameinfo["level1"].collectables.length; j++){
			this.hazards.push(gameinfo[curlevel].hazards[i].type);
		}
		this.bonustimelimit = gameinfo["level1"].bonustimelimit;
	},

	/*
	Can be called with or without parameters.
	*/
	definePlatformType: function(platformType, callback) {
		var playerImg = null,
			p1Img = null,
			players = null,
			grounds = null;

		if(!platformType) {
			platformType = gameinfo.level1.platformType;
			playerImg = gameinfo.level1.playerImg;
			p1Img = gameinfo.level1.scroll[0].item;
		} else {
			if(this.p1 != null) {
				// set background 1 to null
				gameinfo.level1.scroll[0] = { item:null, speed:5 };
				editor.changeP1Img();
			}
		}
		gameinfo.level1.platformType = platformType;
		if(platformType == "air") {
			// flying game
			players = textureMenu.airPlayers;
			grounds = textureMenu.airGrounds;

			document.getElementById("jumpPowers").style.display = "none";
		} else {
			// driving or running game
			players = textureMenu.groundPlayers;
			grounds = textureMenu.grounds;

			document.getElementById("jumpPowers").style.display = "block";
		}
		if(!playerImg) playerImg = players[0].value;
		editor.populateSelect('#playerList', players, playerImg);
		editor.populateSelect('#p1List', grounds, p1Img);
		editor.changePlayerImg(playerImg);

		if(_.isFunction(callback)) {
			callback.call(editor);
		}
	},

	changeBgColor: function(colorVal) {
		if(_.isUndefined(colorVal) || _.isNull(colorVal)) {
			this.bgcolor = gameinfo.level1.bgcolor;
		} else {
			this.bgcolor = gameinfo.level1.bgcolor = colorVal;
		}
		if(this.bgcolor) {
			Crafty.background(this.bgcolor);
		}
	},

	changeP1Img: function(imgName) {
		if(_.isUndefined(imgName) || _.isNull(imgName)) {
			this.p1 = gameinfo.level1.scroll[0].item;
		} else {
			this.p1 = imgName;
			gameinfo.level1.scroll[0] = {item:this.p1, speed:this.p1_speed};
		}
		Crafty("p1_ref").each(function(i) {
			this.destroy();
		});
		Crafty.e("2D, DOM, Image, p1_ref," + this.p1).attr({x: 0, y: this.p1y, z: 10});
	},

	changeP2Img: function(imgName) {
		if(_.isUndefined(imgName) || _.isNull(imgName)) {
			this.p2 = gameinfo.level1.scroll[1].item;
		} else {
			if(this.p2 != null) {
				Crafty("p2_ref").each(function(i) {
					this.destroy();
				});
			}
			this.p2 = imgName;
			gameinfo.level1.scroll[1] = {item:this.p2, speed:this.p2_speed};
		}
		Crafty.e("2D, DOM, Image, p2_ref," + this.p2).attr({x: 0, y: this.p2y, z: 9});
	},

	changeP3Img: function(imgName) {
		if(_.isUndefined(imgName) || _.isNull(imgName)) {
			this.p3 = gameinfo.level1.scroll[2].item;
		} else {
			if(this.p3 != null) {
				Crafty("p3_ref").each(function(i) {
					this.destroy();
				});
			}
			this.p3 = imgName;
			gameinfo.level1.scroll[2] = {item:this.p3, speed:this.p3_speed};
		}
		Crafty.e("2D, DOM, Image, p3_ref," + this.p3).attr({x: 0, y: this.p3y, z: 8});
	},

	changePlayerImg: function(imgName) {
		if(_.isUndefined(imgName) || _.isNull(imgName)) {
			this.playerImg = gameinfo.level1.playerImg;
		} else {
			if(this.playerImg != null) {
				Crafty("player_ref").each(function(i) {
					this.destroy();
				});
			}
			this.playerImg = imgName;
			gameinfo.level1.playerImg = this.playerImg;
		}
		Crafty.e("2D, DOM, Image, player_ref," + this.playerImg).attr({x: 80, y: 200, z: 1000});
	},

	changeSkyImg: function(imgName) {
		if(_.isUndefined(imgName) || _.isNull(imgName)) {
			this.sky = gameinfo.level1.sky;
		} else {
			if(this.sky != null) {
				Crafty("sky_ref").each(function(i) {
					this.destroy();
				});
			}
			this.sky = imgName;
			gameinfo.level1.sky = this.sky;
		}
		Crafty.e("2D, DOM, Image, sky_ref," + this.sky).attr({x: 0, y: 0, z: 0});
	},

	getJumpPower: function(){
		var selected=document.getElementById("jumpList");
		gameinfo.level1.jumpPower = parseInt(selected.options[selected.selectedIndex].value);
	},

	addStarRule: function(){
		gameinfo["level1"].star3limit = document.getElementById("star3").value;
		gameinfo["level1"].star2limit = document.getElementById("star2").value;
		gameinfo["level1"].star1limit = document.getElementById("star1").value;
	},

	addPowerup: function(){
		var selected=document.getElementById("extraList");
		if(selected.options[selected.selectedIndex].value == "0"){
			gameinfo["level1"].extraLife = false;
		}else{
			gameinfo["level1"].extraLife = true;
		}
	},

	addTurbo: function(){
		var selected=document.getElementById("turboList");
		if(selected.options[selected.selectedIndex].value == "0"){
			gameinfo["level1"].turboSpeed = false;
		}else{
			gameinfo["level1"].turboSpeed = true;
		}
	},

	changeDenominator: function(action) {
		var numVal = ($('#fractionDenominatorVal').val()) ? $('#fractionDenominatorVal').val() : 0;
		numVal = parseInt(numVal, 10);
		if(action == 'increase') {
			if(numVal < editor.maxFractionNumber) numVal++;
			$('#fractionDenominatorVal').val(numVal);
			$('#fractionDenominator').text(numVal);
		} else if (action == 'decrease') {
			if(numVal > 0) numVal--;
			$('#fractionDenominatorVal').val(numVal);
			$('#fractionDenominator').text(numVal);

		}
	},

	changeNumerator: function(action) {
		var numVal = ($('#fractionNumeratorVal').val()) ? $('#fractionNumeratorVal').val() : 0;
		numVal = parseInt(numVal, 10);
		if(action == 'increase') {
			if(numVal < editor.maxFractionNumber) numVal++;
			$('#fractionNumeratorVal').val(numVal);
			$('#fractionNumerator').text(numVal);
		} else if (action == 'decrease') {
			if(numVal > 0) numVal--;
			$('#fractionNumeratorVal').val(numVal);
			$('#fractionNumerator').text(numVal);

		}
	},


	bindRemoveFractionTask: function() {
		$('#fractionTasks').on('click', '.removeFractionTask', function(e) {
			var itemRef = $(this).data('uuid');
			if(itemRef) {
				var fractionTasks = _.reject(gameinfo.level1.fractionRules, function(obj){ return obj.eref == itemRef; });
				gameinfo.level1.fractionRules = fractionTasks;
				$(this).parentsUntil('.drop').remove();
				editor.setGame();
			}
		});
	},



	/*
		fractionRule = {
			'denominator': 2,
			'numerator': 3,
			'eref': editor.guid() // uuid
		}
	*/
	addFractionTask: function(fractionRule, addNew) {
		if( _.isNumber(fractionRule.denominator) && _.isNumber(fractionRule.numerator) ) {
			if(fractionRule.denominator >= fractionRule.numerator) {
				if(addNew) {
					// reset form values to default
					$('#fractionNumerator').text(0);
					$('input#fractionNumeratorVal').val(0);
					$('#fractionDenominator').text(1);
					$('input#fractionDenominatorVal').val(1);
					// add to gameinfo
					gameinfo.level1.fractionRules.push(fractionRule);
					editor.setGame();
				}

				// show fraction task
				var container = $("<div>").addClass('itemContainer row');
				var activeElement = $("<div>").addClass('activeItem col-sm-9');
				var txtNode = $('<span>').html('<b>' + fractionRule.numerator + "/"+ fractionRule.denominator +"</b>");
				activeElement.append(txtNode);
				container.append(activeElement);

				// add remove button
				var btn = $('<button>').addClass('btn btn-danger removeBtn removeFractionTask');
				btn.data('uuid', fractionRule.eref);
				btn.text('REMOVE');
				var btnContainer = $('<div>').addClass('col-sm-3');
				btnContainer.append(btn);
				container.append(btnContainer);
				$('#fractionTasks').append(container);

			}

			return true;
		} else {
			return false;
		}

	},

	// if there is missing eref-property in array object, create one 
	createMissingErefs: function(erefArray) {
		_.each(erefArray, function(item, index, list) {
			if(_.isNull(item.eref) || _.isUndefined(item.eref) ) {
				item.eref = editor.guid();				
			}
		});
	},

	bindRemoveMatchRule: function() {
		$('#matching').on('click', '.removeMatchRule', function(e) {
			var itemRef = $(this).data('uuid');
			if(itemRef) {
				var wordRules = _.reject(gameinfo.level1.wordRules, function(obj){ return obj.eref == itemRef; });
				gameinfo.level1.wordRules = wordRules;
				$(this).parentsUntil('.drop').remove();
				editor.setGame();
			}
		});
	},

	addMatchRule: function(matchRule, addNew) {
		if( !_.isEmpty(matchRule.task) && !_.isEmpty(matchRule.right) ) {
			var ruleTxt = matchRule.task + " = " + matchRule.right;
			var wrongAnswers = '';
			if( !_.isEmpty(matchRule.wrongArr) ) {
				wrongAnswers = matchRule.wrongArr.join(', ');
			}
			$('.words_input').val('');

			// show matching rule
			var container = $("<div>").addClass('itemContainer row');
			var activeElement = $("<div>").addClass('activeItem col-sm-9');
			var txtNode = $('<span>').html('<b>' + ruleTxt + "</b><br>wrong answers: " + wrongAnswers);
			activeElement.append(txtNode);
			container.append(activeElement);

			// add remove button
			var btn = $('<button>').addClass('btn btn-danger removeBtn removeMatchRule');
			btn.data('uuid', matchRule.eref);
			btn.text('REMOVE');
			var btnContainer = $('<div>').addClass('col-sm-3');
			btnContainer.append(btn);
			container.append(btnContainer);
			$('#matching').append(container);

			if(!_.isUndefined(addNew) && addNew == true) {
				// new element, insert into gameinfo json
				gameinfo.level1.wordRules.push(matchRule);
				editor.setGame();
			}

			return true;
		} else {
			return false;
		}

	},

	addMemoryRule: function() {
		document.getElementById("matchWarning").innerHTML="";
		var start=document.getElementById("memoryStart").value;
		var increment=document.getElementById("memoryIncrease").value;
		if(start!="" && increment!="" && start!=" " && increment!=" "){
			gameinfo["level1"].memoryStart = parseInt(start);
			gameinfo["level1"].memoryIncrease = parseInt(increment);
			editor.setGame();
		}
		else{
			showWarning("Either a starting number or an increment is missing!");
		}
	},

	bindRemoveCollectible: function(btn) {
		btn.onclick = function() {
			var item = btn.getAttribute('item');
			var itemref = btn.getAttribute('data-eref');
			Crafty(itemref).each(function(i) {
				this.destroy();
			});			
			var index = editor.collectables.indexOf(item);
			if (index > -1) {
	    		editor.collectables.splice(index, 1);
	    		gameinfo.level1.collectables.splice(index, 1);
	    		editor.setGame();
	    		editor.updateCollectiblesView();
			}
			$(this).parentsUntil('.drop').remove();
		}
	},

	getCollectable: function(collectable, addNew) {
		this.collectables.push(collectable.type);
		if(!_.isUndefined(addNew) && addNew == true) {
			// new element, insert into gameinfo json
			gameinfo.level1.collectables.push(collectable);
			$('select#collectList').val('');
			editor.setGame();
		}
		var container = document.createElement("div");
		container.classList.add("itemContainer");
		container.classList.add("row");

		var newElement = document.createElement("div");
		newElement.className = "activeItem";
		newElement.classList.add("col-sm-9");
		var node = document.createTextNode(collectable.name);
		node.id = collectable.type;
		newElement.appendChild(node);

		container.appendChild(newElement);
		
		// remove button
		var btn = document.createElement("BUTTON");
		btn.setAttribute('item', collectable.type);
		btn.setAttribute('data-eref', collectable.eref);
		btn.classList.add("btn");
		btn.classList.add("btn-danger");
		btn.classList.add("removeBtn");
		var t = document.createTextNode("REMOVE");
		btn.appendChild(t);

		var btnContainer = document.createElement("div");
		btnContainer.classList.add("col-sm-3");
		btnContainer.appendChild(btn);

		container.appendChild(btnContainer);

		var element = document.getElementById("collect-drop");
		element.appendChild(container);

		editor.bindRemoveCollectible(btn);
	},

	getWordInterval: function(){
		var selected=document.getElementById("wordIntervalList");
		gameinfo["level1"].wordInterval = selected.options[selected.selectedIndex].value;
	},

	getPieceAmount: function(){
		var selected=document.getElementById("pieceList");
		gameinfo["level1"].pieceAmount = selected.options[selected.selectedIndex].value;
	},

	getSliceAmount: function(){
		var selected=document.getElementById("sliceList");
		gameinfo["level1"].sliceAmount = selected.options[selected.selectedIndex].value;
	},

	addPizzaTask: function(){
		var numerator = gameinfo["level1"].sliceAmount;
		var denominator = gameinfo["level1"].pieceAmount;
		var img = new Image();
		var parent = document.getElementById('pizzaTasks');

		img.onload = function() {
	  		parent.appendChild(img);
		};

		img.src = "img/pizza/p_"+numerator+"_"+denominator+".png";
		img.style.width = "50px";
		img.style.height = "50px";
		gameinfo["level1"].pizzaRules.push(numerator+"/"+denominator);
	},

	bindRemoveHazard: function(btn) {
		btn.onclick=function() {
			var item = btn.getAttribute('item');
			var itemref = btn.getAttribute('data-eref');
			Crafty(itemref).each(function(i) {
				this.destroy();
			});			
			var index = editor.hazards.indexOf(item);
			if (index > -1) {
	    		editor.hazards.splice(index, 1);
	    		gameinfo["level1"].hazards.splice(index, 1);
	    		editor.setGame();
	    		editor.updateHazardsView();
			}
			$(this).parentsUntil('.drop').remove();
		}
	},

	getHazard: function(hazard, addNew) {
		this.hazards.push(hazard.type);
		if(!_.isUndefined(addNew) && addNew == true) {
			// new element, insert into gameinfo json
			gameinfo["level1"].hazards.push(hazard);
			$('select#avoidList').val('');
			editor.setGame();
		}

		var container = document.createElement("div");
		container.classList.add("itemContainer");
		container.classList.add("row");

		var newElement = document.createElement("div");
		newElement.className = "activeItem";
		newElement.classList.add("col-sm-9");
		var node = document.createTextNode(hazard.name);
		node.id = hazard.type;
		newElement.appendChild(node);

		container.appendChild(newElement);
		
		// remove button
		var btn = document.createElement("BUTTON");
		btn.setAttribute('item', hazard.type);
		btn.setAttribute('data-eref', hazard.eref);
		btn.classList.add("btn");
		btn.classList.add("btn-danger");
		btn.classList.add("removeBtn");
		var t = document.createTextNode("REMOVE");
		btn.appendChild(t);

		var btnContainer = document.createElement("div");
		btnContainer.classList.add("col-sm-3");
		btnContainer.appendChild(btn);

		container.appendChild(btnContainer);

		var element = document.getElementById("avoid-drop");
		element.appendChild(container);

		editor.bindRemoveHazard(btn);
	},

	getHazardEffect: function(){
		var selected=document.getElementById("hazardEffectList");
		gameinfo["level1"].hazardEffect = selected.options[selected.selectedIndex].value;
	},



	createSpeedView: function (){
		//<form id="hazardSpeedForm"></form>
		var speedArr = ["average", "slow", "fast"];
		var parent = document.getElementById("collectSpeed");
		$("#collectSpeed").empty();
		var cDiv = document.getElementById("collectSpeed");
		
		for(var i = 0; i < gameinfo["level1"].collectables.length; i++) {
			//var itemText = gameinfo["level1"].collectables[i].type;// {type: selected.options[selected.selectedIndex].text, xspeed: 0, yspeed: 0} 
	    	var itemText = gameinfo["level1"].collectables[i].name;
	    	var itemSpeed = gameinfo["level1"].collectables[i].speed;
	    	var p = document.createElement("label");
	    	p.classList.add("dropLabel");
			var pt = document.createTextNode(itemText);
			var h = document.createElement("hr");
	    	p.appendChild(pt);
			cDiv.appendChild(p);
	    	editor.createDropDown(speedArr, cDiv, i, editor.getSpeed, itemSpeed, "speedList_");
	    	cDiv.appendChild(h);	
	   	}
	   	
	   	var hParent = document.getElementById("hazardSpeed");
		$("#hazardSpeed").empty();
		var hDiv = document.getElementById("hazardSpeed");
		
		for(var j = 0; j < gameinfo["level1"].hazards.length; j++) {
			//var itemTextH = gameinfo["level1"].hazards[j].type;// {type: selected.options[selected.selectedIndex].text, xspeed: 0, yspeed: 0} 
	    	var itemTextH = gameinfo["level1"].hazards[j].name;
	    	var itemSpeedH = gameinfo["level1"].hazards[j].speed;
	    	var ph = document.createElement("label");
	    	ph.classList.add("dropLabel");
			var pth = document.createTextNode(itemTextH);
			var hh = document.createElement("hr");
	    	ph.appendChild(pth);
			hDiv.appendChild(ph);
	    	editor.createDropDown(speedArr, hDiv, j, editor.getHSpeed, itemSpeedH, "speedListH_");
	    	hDiv.appendChild(hh);	
	   	}
	},

	createScoreView: function (){
		var scoreArr = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
		var parent = document.getElementById("collectScore");
		$("#collectScore").empty();
		var cDiv = document.getElementById("collectScore");
		
		var cTitle = document.createElement("p");
		var ct = document.createTextNode("Scores of collectibles:");
		cTitle.appendChild(ct);
		cDiv.appendChild(cTitle);
		
		for(var i = 0; i < gameinfo["level1"].collectables.length; i++) {
			//var itemText = gameinfo["level1"].collectables[i].type;
			var itemText = gameinfo["level1"].collectables[i].name;
	    	var itemScore = gameinfo["level1"].collectables[i].score;
	    	var p = document.createElement("label");
	    	p.classList.add("dropLabel");
			var pt = document.createTextNode(itemText);
			var h = document.createElement("hr");
	    	p.appendChild(pt);
			cDiv.appendChild(p);
	    	editor.createDropDown(scoreArr, cDiv, i, editor.getScore, itemScore, "scoreList_");
	    	cDiv.appendChild(h);	
	   	}
	   	
	   	var scoreArr2 = [0, -100, -200, -300, -400, -500, -600, -700, -800, -900, -1000];
	   	var parent = document.getElementById("hazardScore");
		$("#hazardScore").empty();
		var hDiv = document.getElementById("hazardScore");
		console.log(hDiv);
		
		var hTitle = document.createElement("p");
		var ht = document.createTextNode("Scores of hazards:");
		hTitle.appendChild(ht);
		hDiv.appendChild(hTitle);
		
		for(var h = 0; h<gameinfo["level1"].hazards.length; h++) {
			var itemTextH = gameinfo["level1"].hazards[h].type;
			var itemTextH = gameinfo["level1"].hazards[h].name;
	    	var itemScoreH = gameinfo["level1"].hazards[h].score;
	    	var ph = document.createElement("label");
	    	ph.classList.add("dropLabel");
			var pth = document.createTextNode(itemTextH);
			var hh = document.createElement("hr");
	    	ph.appendChild(pth);
			hDiv.appendChild(ph);
	    	editor.createDropDown(scoreArr2, hDiv, h, editor.getHScore, itemScoreH, "scoreListH_");
	    	hDiv.appendChild(hh);	
	   	}
	},


	createMatchView: function() {
		document.getElementById("words").style.display="none";
		document.getElementById("wordInterval").style.display="none";
		document.getElementById("fractions").style.display="none";
		document.getElementById("memory").style.display="none";
		
		if(gameinfo["level1"].matchRule == "word"){
			document.getElementById("words").style.display="block";
			document.getElementById("wordInterval").style.display="block";
		}
		if(gameinfo["level1"].matchRule == "memory"){
			document.getElementById("memory").style.display="block";
			document.getElementById("wordInterval").style.display="block";
		}
		if(gameinfo["level1"].matchRule == "pizza"){
			document.getElementById("pizza").style.display="block";
			document.getElementById("wordInterval").style.display="block";
		}
		if(gameinfo["level1"].gameMode == "fraction"){
			document.getElementById("fractions").style.display="block";
		}
	},
		
	createDropDown: function (values, parentElem, index, changeFunction, atr, listId){
		console.log("createDropdown: "+ listId);
		var select=document.createElement("select");
		select.id = listId+index;
		select.onchange = function(){ changeFunction(index) };
		
		for(var i = 0; i < values.length; i++) {
	    	var opt = values[i];
	    	var el = document.createElement("option");
	   		el.textContent = opt;
	   		el.value = opt;
	   		select.appendChild(el);
	   	}
		select.value = atr;
		parentElem.appendChild(select);
	}, 	

	matchPoints: function(state){
		var points;
		var selected;
		if(state == "right"){
			selected=document.getElementById("matchRightList");
			points = selected.options[selected.selectedIndex].value;
			gameinfo["level1"].matchPointsRight = parseInt(points);
		}else{
			selected=document.getElementById("matchWrongList");
			points = selected.options[selected.selectedIndex].value;
			gameinfo["level1"].matchPointsWrong = parseInt(points);
		}	
	},

	getSpeed: function(i){
		console.log("getSpeed");
		var selected=document.getElementById("speedList_"+i);
		var speed = selected.options[selected.selectedIndex].text;
		gameinfo["level1"].collectables[i].speed = speed;
		console.log(gameinfo);
	},

	getHSpeed: function(i){
		console.log("getSpeed");
		var selected=document.getElementById("speedListH_"+i);
		var speed = selected.options[selected.selectedIndex].text;
		gameinfo["level1"].hazards[i].speed = speed;
	},

	getScore: function(i){
		console.log("getScore");
		var selected=document.getElementById("scoreList_"+i);
		var score = selected.options[selected.selectedIndex].text;
		gameinfo["level1"].collectables[i].score = score;
	},
	getHScore: function(i){
		console.log("getHScore");
		var selected=document.getElementById("scoreListH_"+i);
		var score = selected.options[selected.selectedIndex].text;
		gameinfo["level1"].hazards[i].score = score;
	},

	getMode: function(gameMode){
		if(_.isUndefined(gameMode) || _.isNull(gameMode)) {
			gameMode = gameinfo.level1.gameMode;
		}
		this.gameMode = gameMode;
		gameinfo.level1.gameMode = gameMode;
		$('.gameMode').hide();

		if(gameMode == "time") {
			$('#timeMode').fadeIn();
			if(!gameinfo.level1.gameDuration) {
				gameinfo.level1.gameDuration = 60;				
			}
		} else if(gameMode == "survival") {
			$('#survivalMode').fadeIn();
			if(!gameinfo.level1.survivalFactor) {
				gameinfo.level1.survivalFactor = 0.95;
			}
		} else if(gameMode == "distance"){
			$('#distanceMode').fadeIn();
			if(gameinfo.level1.goalDistance) {
				gameinfo.level1.goalDistance = 400;
			}
		}
	},

	getMatchType: function(matchType) {
		if(_.isUndefined(matchType) || _.isNull(matchType)) {
			matchType = gameinfo.level1.matchRule;
		}
		gameinfo.level1.matchRule = matchType;			

		$("#matchWarning").empty();
		$('.matchType, .matchInterval').hide();

		if(matchType == "word") {
			$("#words, #wordInterval").fadeIn();
		} else if(matchType == "memory"){
			$("#memory, #wordInterval").fadeIn();
		} else if(matchType == "fraction"){
			$("#fractions").fadeIn();
		} else {
			// -1 -> set to null
			gameinfo.level1.matchRule = null;
		}
	},

	getGoalDistance: function(goalDistance){
		if(_.isUndefined(goalDistance) || _.isNull(goalDistance)) {
			goalDistance = gameinfo.level1.goalDistance;
		}
		gameinfo.level1.goalDistance = goalDistance;
		return gameinfo.level1.goalDistance;
	},

	getGameDuration: function(gameDuration){
		if(_.isUndefined(gameDuration) || _.isNull(gameDuration)) {
			gameDuration = gameinfo.level1.gameDuration;
		}
		gameinfo.level1.gameDuration = gameDuration;
		return gameinfo.level1.gameDuration;
	},

	getSurvivalValues: function(survivalVal) {
		if(_.isUndefined(survivalVal) || _.isNull(survivalVal)) {
			survivalVal = gameinfo.level1.survivalFactor;
		}
		gameinfo.level1.survivalFactor = survivalVal;
		return gameinfo.level1.survivalFactor;
	},

	getInfo: function(){
		this.instructions=document.getElementById("instructionTxt").value;
		this.title=document.getElementById("titleTxt").value;
		gameinfo["level1"].title = this.title;
		gameinfo["level1"].instructions = this.instructions;
	},

	shuffle: function(array) {
	    var counter = array.length, temp, index;
	    // While there are elements in the array
	    while (counter > 0) {
	        // Pick a random index
	        index = Math.floor(Math.random() * counter);

	        // Decrease counter by 1
	        counter--;

	        // And swap the last element with it
	        temp = array[counter];
	        array[counter] = array[index];
	        array[index] = temp;
	    }
	    return array;
	},

	playSound: function(id) {
		var soundObject = sounds[id];
		var repeats = soundObject.repeats || 1;
		var volume = soundObject.volume ? soundObject.volume : 1;
		Crafty.audio.play(id, repeats, volume);
	},

	checkLocalStoreSupport: function(){
		if(typeof(Storage)!=="undefined"){
	  		console.log("Yes! localStorage and sessionStorage support!");
	  		this.storable=true;
	  	}else{
	  		console.log("Sorry! No web storage support..");
	  		this.storable=false;
	  	}
	},

		playGame: function(){
			window.open("game.html?kissa=100")
		},

	publishGame: function(){
		this.gameToLocal();	
	},
		
	gameToLocal: function(){
		// Put the object into storage
		localStorage.setItem('magosLevel', JSON.stringify(gameinfo));	
	},

	openGame: function(){
		document.getElementById("editor-stage").style.display = "none";
		game.initGame();
	},

	// generate random string
	s4: function() {
	  return Math.floor((1 + Math.random()) * 0x10000)
	             .toString(16)
	             .substring(1);
	},

	// generate guid
	guid: function() {
	  return editor.s4() + editor.s4() + '-' + editor.s4() + '-' + editor.s4() + '-' +
	         editor.s4() + '-' + editor.s4() + editor.s4() + editor.s4();
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

} // editor



function QueryStringToJSON() {            
    var pairs = location.search.slice(1).split('&');    
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });
    return JSON.parse(JSON.stringify(result));
}



// Find the right method, call on correct element
function launchFullScreen(element) {
  if(element.requestFullScreen) {
    element.requestFullScreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  }
}

function toggleFullScreen() {
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

/*function saveTeacherGame(str){
	console.log("save");
	$.post("savegame.php", { gameData: str });
}*/




