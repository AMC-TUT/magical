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

	isMobile: false,

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
	        	utils.notify(i18n.t("Game saved"), 'success');       	
	        });
	        ajaxReq.fail(function (jqXHR, textStatus, errorThrown) {
	        });
	    }
	},

	init: function() {
		this.checkIfMobile();
		utils.i18nInit(this.user.lang_code, this.getGame, editor);
	},

	getGame: function() {
		if(this.gameSlug) {
			utils.djangoUrl = this.djangoUrl; 
			utils.apiUrl = this.apiUrl;
			utils.getGameToEdit(this.gameSlug, this.initEditor);
		}
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
		this.isMobile = isMobile.any();
		return isMobile;
	},

	initEditor: function() {
		utils.initAudio();
		if(this.user.use_uppercase_text) utils.uppercaseAll();
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
		
		
		if(this.isMobile) $('#fullScreenBtn').hide();

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

			Crafty.e("2D, DOM, Image, heart").attr({x: 30, y: 10, z: 1100});
			
			editor.createMissingErefs(gameinfo.level1.wordRules);			
			
			editor.createHelpTexts();
			
			// create predefined UI elements
			editor.createUIElements();
			editor.updateFormValues();
			if(editor.initial) {

				$('#sidebar .btn').click(utils.playSound('silent')); 

				editor.bindUiFormSubmits();
				editor.bindUIElementChanges();
				editor.bindUIClicks();
				// fix modal background scroll issue on iOS
				$('.modal').on('hidden.bs.modal', function () {
					$('body').scrollTop(0);
				});
			}
			editor.initial = false;
		});
		Crafty.scene('preload');
	},

	createHelpTexts: function() {
		var stage = $('#editor-stage');
		$('.stageHelp, .scrollHelp').remove();
		
		var playerHelp = $('<div/>');
		playerHelp.addClass('stageHelp playerHelp');
		playerHelp.text(i18n.t('Player'));
		playerHelp.append('<i class="fa fa-long-arrow-down"></i>');

		var collectiblesHelp = $('<div/>');
		collectiblesHelp.addClass('stageHelp collectiblesHelp');
		collectiblesHelp.text(i18n.t('Collectibles'));
		collectiblesHelp.append('<i class="fa fa-long-arrow-down"></i>');

		var hazardsHelp = $('<div/>');
		hazardsHelp.addClass('stageHelp hazardsHelp');
		hazardsHelp.text(i18n.t('Hazards'));
		hazardsHelp.append('<i class="fa fa-long-arrow-down"></i>');

		stage.append(playerHelp, collectiblesHelp, hazardsHelp);

		if(!gameinfo.level1.scroll[0].hasOwnProperty('item') || !gameinfo.level1.scroll[0].item) {
			var scroll1Help = $('<div/>');
			scroll1Help.addClass('scrollHelp scroll1Help');
			scroll1Help.text(i18n.t('Scrolling element 1'));
			stage.append(scroll1Help);
		}

		if(!gameinfo.level1.scroll[1].hasOwnProperty('item') || !gameinfo.level1.scroll[1].item) {
			var scroll2Help = $('<div/>');
			scroll2Help.addClass('scrollHelp scroll2Help');
			scroll2Help.text(i18n.t('Scrolling element 2'));
			stage.append(scroll2Help);
		}

		if(!gameinfo.level1.scroll[2].hasOwnProperty('item') || !gameinfo.level1.scroll[2].item) {
			var scroll3Help = $('<div/>');
			scroll3Help.addClass('scrollHelp scroll3Help');
			scroll3Help.text(i18n.t('Scrolling element 3'));
			stage.append(scroll3Help);
		}

	},

	updateFormValues: function() {
		// game title
		$('#gameTitle').text(gameinfo.level1.title);
		// game instructions
		$('textarea#instructionTxt').val(gameinfo.level1.instructions);

		// platform type
		if(gameinfo.level1.platformType) {
			$('select#platformList').val(gameinfo.level1.platformType);
		}
		if(gameinfo.level1.jumpPower) {
			//$('select#jumpList').val(gameinfo.level1.jumpPower);
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
		if(gameinfo.level1.memoryStart) {
			$('input#memoryStart').val( parseInt(gameinfo.level1.memoryStart) );
		}
		// matching rule memory increment
		if(gameinfo.level1.memoryIncrease) {
			$('input#memoryIncrease').val( parseInt(gameinfo.level1.memoryIncrease) );
		}

		if(gameinfo.level1.wordInterval) {
			$('select#wordIntervalList').val(gameinfo.level1.wordInterval);	
		}

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
		// extra life
		var hasExtraLife = (gameinfo.level1.extraLife) ? "1" : "0";  
		$('select#extraList').val(hasExtraLife);
		// turbo speed
		var hasTurboSpeed = (gameinfo.level1.turboSpeed) ? "1" : "0";  
		$('select#turboList').val(hasTurboSpeed);

		// sensitivity
		if(gameinfo.level1.hasOwnProperty('sensitivity')) {
			$('select#jumpSensitivityList').val(gameinfo.level1.sensitivity.jump);
			$('select#motionSensitivityList').val(gameinfo.level1.sensitivity.motion);			
		} else {
			// add default sensitivity property for game
			gameinfo.level1['sensitivity'] = {
				jump: 18000,
				motion: 10000
			};
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
		// match add word rule
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
				showWarning(i18n.t("Either a task or an answer is missing!"));
			}
		});

		// match fraction form 
		$('#fractionTaskForm').submit(function(e) {
			e.preventDefault();
			$('#matchWarning').empty();
			var denominator = parseInt($("input#fractionDenominatorVal").val(), 10),
				numerator = parseInt($("input#fractionNumeratorVal").val(), 10);
			if (denominator == 0) {
				showWarning(i18n.t("Denominator can not be null!"));
			} else {
	    		if(denominator >= numerator) {
	    			var fractionRule = {
	    				'denominator': denominator,
	    				'numerator': numerator,
		 				'eref': editor.guid() // uuid
	    			}
	    			editor.addFractionTask(fractionRule, true);
	    		} else {
					showWarning(i18n.t("Denominator has to be equal or greater than numerator!"));
	    		}
			}
		});

		// instructions form
		$('#gameInstructions').submit(function(e) {
			e.preventDefault();
			$('body').scrollTop(0);
			var instructions = $('textarea#instructionTxt').val();
			gameinfo.level1.instructions = instructions;
			editor.setGame();
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
    		utils.playSound('blop');
    		gameinfo.level1.platformType = valueSelected;
    		editor.definePlatformType(valueSelected, editor.setGame);
		});
		$('select#jumpList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.jumpPower = parseInt(valueSelected, 10);
    		editor.setGame();
		});

		// jump sensitivity
		$('select#jumpSensitivityList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.sensitivity.jump = parseInt(valueSelected);
    		editor.setGame();
		});

		// motion sensitivity
		$('select#motionSensitivityList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.sensitivity.motion = parseInt(valueSelected);
    		editor.setGame();
		});

		$('select#modeList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		editor.getMode(valueSelected);
    		editor.setGame();
		});

		$('select#survivalList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		editor.getSurvivalValues(parseFloat(valueSelected));
    		editor.setGame();
		});
		$('select#gameDurationList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		editor.getGameDuration(parseInt(valueSelected, 10));
    		editor.setGame();
		});
		$('select#distanceList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		editor.getGoalDistance(parseInt(valueSelected, 10));
    		editor.setGame();
		});		

		// match
		$('select#matchList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		editor.getMatchType(valueSelected);
    		editor.setGame();
		});
		
		// player image
		$('select#playerList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.playerImg = valueSelected;
    		editor.setGame();
    		editor.changePlayerImg(valueSelected);
		});

		// Background
		// background color
		$('select#colorList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.bgcolor = valueSelected;
    		editor.setGame();
    		editor.changeBgColor(valueSelected);
		});
		// static background element
		$('select#skyList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.sky = valueSelected;
    		editor.setGame();
    		editor.changeSkyImg(valueSelected);
		});
		// scrolling background 3
		$('select#p3List').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.scroll[2] = {item: valueSelected, speed:editor.p3_speed};
    		editor.setGame();
    		editor.createHelpTexts();
    		editor.changeP3Img(valueSelected);
		});
		// scrolling background 2
		$('select#p2List').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.scroll[1] = {item: valueSelected, speed:editor.p2_speed};
    		editor.setGame();
    		editor.createHelpTexts();
    		editor.changeP2Img(valueSelected);
		});
		// scrolling background 1
		$('select#p1List').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.scroll[0] = {item: valueSelected, speed:editor.p1_speed};
    		editor.setGame();
    		editor.createHelpTexts();
    		editor.changeP1Img(valueSelected);
		});

		// collectables
		$('select#collectList').change(function() {
			var optionSelected = $("option:selected", this);
    		var valueSelected = this.value;
    		utils.playSound('blop');
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
    		utils.playSound('blop');
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
    		utils.playSound('blop');
    		gameinfo.level1.itemInterval = valueSelected;
    		editor.setGame();
		});
		// appearance interval of hazards
		$('select#hazardIntervalList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.hazardInterval = valueSelected;
    		editor.setGame();
		});
		// appearance interval of hazards
		$('select#hazardEffectList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.hazardEffect = valueSelected;
    		editor.setGame();
		});

		// extra lives
		$('select#extraList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
			gameinfo.level1.extraLife = (valueSelected == "1") ? true : false; 		
			editor.setGame();    		
		});

		// extra lives
		$('select#turboList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
			gameinfo.level1.turboSpeed = (valueSelected == "1") ? true : false; 		
			editor.setGame();
		});

		// match right points
		$('select#matchRightList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.matchPointsRight = parseInt(valueSelected);
    		editor.setGame();
		});

		// match wrong points
		$('select#matchWrongList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.matchPointsWrong = parseInt(valueSelected);
    		editor.setGame();
		});

		// match appearance interval
		$('select#wordIntervalList').change(function() {
    		var valueSelected = this.value;
    		utils.playSound('blop');
    		gameinfo.level1.wordInterval = parseInt(valueSelected);
    		editor.setGame();
		});

	},
	
	populateSelect: function(selectId, optionsData, selectedVal) {
		$(selectId).empty();
		_.each(optionsData, function(option, index, list) {
			var optionEl = $('<option>');
			var optionText = '';
			if(option.text) {
				optionText = i18n.t(option.text);				
			}
			$(optionEl).val(option.value).text(optionText);
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
		if(gameinfo.level1.collectables.length) {
			$('#collectiblesInterval').fadeIn();
		} else {
			$('#collectiblesInterval').fadeOut();
		}
	},

	updateHazardsView: function() {
		editor.updateItemsView(gameinfo.level1.hazards, 600, 100);
		if(gameinfo.level1.hazards.length) {
			$('#hazardsExtraInfo').fadeIn();
		} else {
			$('#hazardsExtraInfo').fadeOut();
		}		
	},


	updateEditorView: function() {
		editor.updateCollectiblesView();
		editor.updateHazardsView();
		editor.changePlayerImg();
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
		$('.gameType').hide();
		if(platformType == "air") {
			// flying game
			players = textureMenu.airPlayers;
			grounds = textureMenu.airGrounds;
			//$("#jumpPowers").hide();
			$("#motionSensitivity").show();
		} else {
			// driving or running game
			players = textureMenu.groundPlayers;
			grounds = textureMenu.grounds;
			//$("#jumpPowers").show();
			$("#jumpSensitivity").show();
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

	getJumpPower: function() {
		var selected=document.getElementById("jumpList");
		gameinfo.level1.jumpPower = parseInt(selected.options[selected.selectedIndex].value);
	},

	addStarRule: function() {
		gameinfo["level1"].star3limit = document.getElementById("star3").value;
		gameinfo["level1"].star2limit = document.getElementById("star2").value;
		gameinfo["level1"].star1limit = document.getElementById("star1").value;
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
				btn.text(i18n.t("REMOVE"));
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
			
			i18n.t("wrong answers")
			
			var txtNode = $('<span>').html('<b>' + ruleTxt + '</b><br>' + i18n.t("wrong answers") + ': ' + wrongAnswers);
			activeElement.append(txtNode);
			container.append(activeElement);

			// add remove button
			var btn = $('<button>').addClass('btn btn-danger removeBtn removeMatchRule');
			btn.data('uuid', matchRule.eref);
			btn.text(i18n.t("REMOVE"));
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
		var node = document.createTextNode(i18n.t(collectable.name));
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
		var t = document.createTextNode(i18n.t("REMOVE"));
		btn.appendChild(t);

		var btnContainer = document.createElement("div");
		btnContainer.classList.add("col-sm-3");
		btnContainer.appendChild(btn);

		container.appendChild(btnContainer);

		var element = document.getElementById("collect-drop");
		element.appendChild(container);

		editor.bindRemoveCollectible(btn);
	},

	/*getWordInterval: function(){
		var selected=document.getElementById("wordIntervalList");
		gameinfo["level1"].wordInterval = selected.options[selected.selectedIndex].value;
	},*/

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
		var node = document.createTextNode(i18n.t(hazard.name));
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
		var t = document.createTextNode(i18n.t("REMOVE"));
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



	getDropDown: function (values, index, changeFunction, atr, listId, translate){
		$dd = $('<select>').addClass('form-control');
		$dd.attr('id', listId + index);

		$dd.bind( 'change', function() {
			changeFunction(index);
		});

		_.each(values, function(value, index, list) {
	    	var opt = value;
	    	var optText = opt;
			if(translate) {
				optText = i18n.t(opt);
			}
    		var $el = $("<option>").text(optText).val(opt);
	   		$dd.append($el);
		});

		$dd.val(atr);
		return $dd;
	},


	createSpeedView: function () {
		var speedArr = ["average", "slow", "fast"];
		var colContainer = $('#collectSpeed').empty();
		// Collectables
		if(gameinfo.level1.collectables.length) {


			var colForm = $('<form>').addClass('form-horizontal clearfix col-sm-6').attr('id', 'collectableSpeeds');
			var colFormset = $('<formset>');
			var colLegend = $('<legend>').text(i18n.t("Speeds for collectibles"));
			colFormset.append(colLegend);
			// create form group for collectible
			_.each(gameinfo.level1.collectables, function(collectable, index, list) {
				// form-group
		    	var $formRow = $('<div>').addClass("form-group clearfix");
		    	// label
				var $p = $("<label>").addClass('col-sm-6');
				var itemName = i18n.t(collectable.name);
				$p.text(itemName);
		    	$formRow.append($p);
		    	// select
		    	var $dd = editor.getDropDown(speedArr, index, editor.getSpeed, collectable.speed, "speedList_", true);
		    	// select container
		    	var $ddContainer = $('<div>').addClass("col-sm-6");
		    	$ddContainer.append($dd);
		    	$formRow.append($ddContainer);
				colFormset.append($formRow);
			});
			colForm.append(colFormset);
			// add form to dom
			colContainer.append(colForm);
		}
		// Hazards
		if(gameinfo.level1.hazards.length) {

			var hazForm = $('<form>').addClass('form-horizontal clearfix col-sm-6').attr('id', 'hazardsSpeeds');
			var hazFormset = $('<formset>');
			var hazLegend = $('<legend>').text(i18n.t("Speeds for hazards"));
			hazFormset.append(hazLegend);
			// create form group for hazards
			_.each(gameinfo.level1.hazards, function(hazard, index, list) {
				// form-group
		    	var $formRow = $('<div>').addClass("form-group clearfix");
		    	// label
				var $p = $("<label>").addClass('col-sm-6');
				var itemName = i18n.t(hazard.name);
				$p.text(itemName);
		    	$formRow.append($p);
		    	// select
		    	var $dd = editor.getDropDown(speedArr, index, editor.getHSpeed, hazard.speed, "speedListH_", true);
		    	// select container
		    	var $ddContainer = $('<div>').addClass("col-sm-6");
		    	$ddContainer.append($dd);
		    	$formRow.append($ddContainer);
				hazFormset.append($formRow);
			});
			hazForm.append(hazFormset);
			// add form to dom
			colContainer.append(hazForm);		
		}

	},

	createScoreView: function() {
		var scoreArr = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

		var colContainer = $('#collectScore').empty();
		// Collectables
		if(gameinfo.level1.collectables.length) {
			var colForm = $('<form>').addClass('form-horizontal clearfix col-sm-6').attr('id', 'collectablePoints');
			var colFormset = $('<formset>');
			var colLegend = $('<legend>').text(i18n.t('Scores for collectibles'));
			colFormset.append(colLegend);
			// create form group for collectible
			_.each(gameinfo.level1.collectables, function(collectable, index, list) {
				// form-group
		    	var $formRow = $('<div>').addClass("form-group clearfix");
		    	// label
				var $p = $("<label>").addClass('col-sm-7');
				$p.text(i18n.t(collectable.name));
		    	$formRow.append($p);
		    	// select
		    	var $dd = editor.getDropDown(scoreArr, index, editor.getScore, collectable.score, "scoreList_");
		    	// select container
		    	var $ddContainer = $('<div>').addClass("col-sm-5");
		    	$ddContainer.append($dd);
		    	$formRow.append($ddContainer);
				colFormset.append($formRow);
			});
			colForm.append(colFormset);
			// add form to dom
			colContainer.append(colForm);
		}

		var hazContainer = $('#hazardScore').empty();
		var hazScoreArr = [0, -100, -200, -300, -400, -500, -600, -700, -800, -900, -1000];

		// Hazards
		if(gameinfo.level1.hazards.length) {
			var hazForm = $('<form>').addClass('form-horizontal clearfix col-sm-6').attr('id', 'hazardPoints');
			var hazFormset = $('<formset>');
			var hazLegend = $('<legend>').text(i18n.t('Scores for hazards'));
			hazFormset.append(hazLegend);
			// create form group for hazards
			_.each(gameinfo.level1.hazards, function(hazard, index, list) {
				// form-group
		    	var $formRow = $('<div>').addClass("form-group clearfix");
		    	// label
				var $p = $("<label>").addClass('col-sm-7');
				$p.text(i18n.t(hazard.name));
		    	$formRow.append($p);
		    	// select
		    	var $dd = editor.getDropDown(hazScoreArr, index, editor.getHScore, hazard.score, "scoreListH_");
		    	// select container
		    	var $ddContainer = $('<div>').addClass("col-sm-5");
		    	$ddContainer.append($dd);
		    	$formRow.append($ddContainer);
				hazFormset.append($formRow);
			});
			hazForm.append(hazFormset);
			// add form to dom
			hazContainer.append(hazForm);
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
		if(gameinfo["level1"].gameMode == "fraction"){
			document.getElementById("fractions").style.display="block";
			document.getElementById("wordInterval").style.display="block";			
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

	matchPoints: function(state) {
		var points;
		var selected;
		if(state == "right") {
			selected=document.getElementById("matchRightList");
			points = selected.options[selected.selectedIndex].value;
			gameinfo["level1"].matchPointsRight = parseInt(points);
		} else {
			selected=document.getElementById("matchWrongList");
			points = selected.options[selected.selectedIndex].value;
			gameinfo["level1"].matchPointsWrong = parseInt(points);
		}	
	},

	getSpeed: function(i) {
		var speed = $('#speedList_' + i).val();
		utils.playSound('blop');
		gameinfo.level1.collectables[i].speed = speed;
		editor.setGame();
	},

	getHSpeed: function(i) {
		var speed = $('#speedListH_' + i).val();
		utils.playSound('blop');
		gameinfo.level1.hazards[i].speed = speed;
		editor.setGame();
	},

	getScore: function(i) {
		var score = $('#scoreList_' + i).val();
		utils.playSound('blop');
		gameinfo.level1.collectables[i].score = score;
		editor.setGame();
	},

	getHScore: function(i){
		var score = $('#scoreListH_' + i).val();
		utils.playSound('blop');
		gameinfo.level1.hazards[i].score = score;
		editor.setGame();
	},

	getMode: function(gameMode) {
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
			if(!gameinfo.level1.goalDistance) {
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
			$("#fractions, #wordInterval").fadeIn();
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
		
	gameToLocal: function() {
		// Put the object into storage
		localStorage.setItem('magosLevel', JSON.stringify(gameinfo));	
	},

	openGame: function() {
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




