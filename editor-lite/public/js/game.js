
var game = {
	djangoUrl: 'http://localhost:8080',
	apiUrl: '/api/v1/games/',
	user: null,	
	preview: true,
	gameSlug: null,
	mediaLoader: null,
	fontGame: null,
	playerDead: null,
	score: null,
	level: null,
	lives: null,
	stars: null,
	mistakes: null,
	fishInterval: null,
	avoidInterval: null,
	collectableInterval: null,
	storable: null,
	startTime: null,
	endTime: null,
	p1: null,
	p2: null,
	p3: null,
	p1y: null,
	p2y: null,
	p3y: null,
	p1_speed: null,
	p2_speed: null,
	p3_speed: null,
	sky: null,
	player: null,
	playerImg: null,
	gravity: null,
	ymov: null,
	itemInterval: null,
	hazardInterval: null,
	fractionInterval:null,
	instructions: null,
	title: null,
	collectables: null,
	avoidables: null,
	bonustimelimit: null,
	gameMode: null,
	meters: null,
	reached: null,
	curTask: null,
	turbo: null,
	turboInterval:null,
	turboMultiplier:null,
	curAnswer: null,
	curAnswers: null,
	curTaskEref: null,
	KEYCODE_UP: null,
	yVel: null,
	groundGravity: null,
	isJumping: null,
	characterGround: null,
	fontColor: "#000000",
	isMobile: false,

	getGameToPlay: function() {
		if(this.gameSlug) {
			utils.djangoUrl = this.djangoUrl; 
			utils.apiUrl = this.apiUrl;
			Crafty.init(1024, 748);
			utils.getGameToPlay(this.gameSlug, this.initGame, game);
		}
	},

	/* PLAY game */
	initPlay: function() {
		//this.preview = false;
		var lang_code = 'en'; 
		if(this.user) {
			lang_code = this.user.lang_code;
		}
		utils.i18nInit(lang_code, this.getGameToPlay, game);
	},

	
	/* PREVIEW game */
	initGame: function() {
		this.isMobile = utils.checkIfMobile();

		utils.initAudio();

		if(gameinfo.level1.fontColor) {
			this.fontColor = gameinfo.level1.fontColor;			
		}

		this.mediaLoader = new MediaLoader();
		this.fontGame = {font: 'Arial', size: 24, color: this.fontColor};
		this.playerDead = false;
		this.score = 0;
		this.level = 1;
		this.stars = 0;
		this.lives = 3;
		this.mistakes = 0;
		this.coinAmount=0;
		this.storable=false;
		this.p1 = null;
		this.p2 = null;
		this.p3 = null;
		this.player = null;
		this.sky = null;
		this.p1_speed = null;
		this.p2_speed = null;
		this.p3_speed = null;
		this.playerImg = null;
		this.gravity = 0.05;
		this.ymov = 0;
		this.instructions= "Write instructions.";
		this.title= "Give a name to the game.";
		this.p1y = 578;
		this.p2y = 478;
		this.p3y = 378;
		this.collectables = [];
		this.avoidables = [];
		this.itemInterval;
		this.extralifeInterval = null;
		this.hazardInterval;
		this.fractionInterval;
		this.turboInterval;
		this.startTime;
		this.endTime;
		this.avoidInterval;
		this.gameMode = "normal";
		this.meters  = null;
		this.reached = 0;
		this.curTask = null;
		this.turbo = false;
		this.turboMultiplier = 1;
		this.curAnswer;
		this.curAnswers = [];
		this.KEYCODE_UP = 38;
		this.yVel = 0;
		this.groundGravity = 1.2;
		this.isJumping = true;
		this.characterGround = 620;

		// ###### PRELOAD ############## Preload all media used by the game and the selected level
		Crafty.scene('preloadgame', function() {
			Crafty.e('Text2').setStyle(game.fontGame).text('Loading...');
			game.mediaLoader.addImages(textures);
			game.mediaLoader.load(function(success) {
				if(success) {
					game.getGameData();
				}
			});
		});


		// ######## INTRO SCENE ######################
		Crafty.scene('intro', function() {
			game.clearIntervals();
			Crafty.background(gameinfo["level1"].bgcolor);
			Crafty.e("2D, DOM, Image, Mouse, magos-logo").attr({x: 20, y: 20, z:1000});
			var stage = $('#cr-stage');

			var playBtn = $('<button>');
			playBtn.attr('id', 'playBtn');
			playBtn.addClass('btn btn-primary magosLiteBtn');
			playBtn.css({color: game.fontColor });
			playBtn.text(i18n.t('Play'));
			stage.append(playBtn);
			playBtn.click(function() {
				if(!this.isMobile) {
					utils.requestFullScreen();
				}
				utils.playSound('jippii');
				$('#playBtn, #editBtn, #backBtn').remove();
				Crafty.scene('game');
			});

			if(game.preview) {
				var editBtn = $('<button>');
				editBtn.attr('id', 'editBtn');
				editBtn.addClass('btn btn-success magosLiteBtn');
				editBtn.css({color: game.fontColor });
				editBtn.text(i18n.t('Edit'));
				stage.append(editBtn);
				editBtn.click(function() {
					//$('#playBtn, #editBtn, #backBtn').remove();
					//$("#editor-stage").show();
					//Crafty.scene('editor');
					var editorUrl = game.djangoUrl + '/editor-lite/edit/' + game.gameSlug;
					window.location = editorUrl;
				});
			} else {
				var backBtn = $('<button>');
				backBtn.attr('id', 'backBtn');
				backBtn.addClass('btn btn-danger magosLiteBtn');
				backBtn.css({color: game.fontColor });
				backBtn.text(i18n.t('Back'));
				stage.append(backBtn);
				backBtn.click(function() {
					window.location = game.djangoUrl;
				});
			}

			Crafty.e("TitleText, DOM, 2D, Text")
				.attr({ x: 200, y: 100, w: 600, h: 300 })
				.text(game.title)
				.textFont({ size: '45px', weight: 'bold' })
				.textColor(game.fontColor);

			Crafty.e("IntroText, DOM, 2D, Text")
				.attr({ x: 200, y: 180, w: 600, h: 300 })
				.text(game.instructions)
				.textFont({ size: '25px', weight: 'bold' })
				.textColor(game.fontColor);

			if(game.user.use_uppercase_text) utils.uppercaseAll();

		});


		// ########### GAME SCENE #######################
		Crafty.scene('game', function() {
			Crafty.canvas.init();
			var matchMode = true;
			Crafty.background(gameinfo["level1"].bgcolor);
			game.startTime = new Date();
				
			var p1_1 = Crafty.e("2D, DOM, Image,"+game.p1).attr({x: 0, y: game.p1y, z: 10});
			var p1_2 = Crafty.e("2D, DOM, Image,"+game.p1).attr({x: 1200, y: game.p1y, z: 10});
			var p2_1 = Crafty.e("2D, DOM, Image,"+game.p2).attr({x: 0, y: game.p2y, z: 9});
			var p2_2 = Crafty.e("2D, DOM, Image,"+game.p2).attr({x: 1200, y: game.p2y, z: 9});	
			var p3_1 = Crafty.e("2D, DOM, Image,"+game.p3).attr({x: 0, y: game.p3y, z: 8});
			var p3_2 = Crafty.e("2D, DOM, Image,"+game.p3).attr({x: 1200, y: game.p3y, z: 8});
			
			var player;
			
			var sky = Crafty.e("2D, DOM, Image,"+ game.sky).attr({x: 0, y: 0, z: 0});	
			var heart1 = Crafty.e("2D, DOM, Image, heart").attr({x: 30, y: 10, z: 1100});
			var exit = Crafty.e("2D, DOM, Mouse, Image, exit").attr({x: 960, y: 5, z: 1100});
				
			// Parallax scroll stuff
			var p1tween1;
			var p1tween2;
			var p2tween1;
			var p2tween2;
			var p3tween1;
			var p3tween2;
			var coinstate; // tuhoa
				
			// Acceleration stuff
			var ax = 0;
			var ay = 0;
			var az = 0;
			var oldx = 0;
			var oldy = 0;
			var oldz = 0;
			var activated = false;
			var delay = 100;
			
			var distanceCom;
			var answerCounter = 0;
			game.lives = 3;
			playerDead = false;
			game.score=0;
			game.coinAmount=0;
			
			exit.bind('Click', function() {
				$(Crafty.canvas._canvas).remove();
				Crafty.scene('intro');
			});
			/*exit.onMouseDown = function(e) {
				Crafty.scene('intro');
			}
			Crafty.addEvent(exit, exit._element, "mousedown", exit.onMouseDown);*/
			
			if(game.gameMode == "time") {
				Crafty.e('GameTimer').gametimer(gameinfo["level1"].gameDuration);
			}
			
			if(game.gameMode == "survival") {
				Crafty.e('GameClock').gameclock();
			}
			
			if(game.gameMode == "distance") {
				distanceCom = Crafty.e('DistanceMeter').distancemeter();
			}

			if(gameinfo.level1.platformType != "ground" && game.avoidables.length > 0) {
				var panicBtn = Crafty.e("2D, DOM, Image, Mouse, Keyboard, panic").attr({x: 20, y: 70, z: 1000});
				panicBtn.bind('MouseDown', function (e) {
					//e.stopPropagation();
					console.log('PANIC');
					Crafty("avoidable").each(function(i) {
						game.addExplosion(this.x,this.y);
						this.destroy();
					});
				});

				panicBtn.bind('KeyDown', function (e) { 
					if (this.isDown('D')) {
						console.log('PANIC');
						Crafty("avoidable").each(function(i) {
							game.addExplosion(this.x,this.y);
							this.destroy();
						});					
					}
				});

			}

			
			if(gameinfo["level1"].matchRule == "word") {
				Crafty.e("2D, DOM, Image, sign").attr({x: 190, y: 5, z: 1000});
				var taskLabel = Crafty.e("TaskLabel").taskLabel(195, 10, i18n.t("task"), '#FFFFFF');
				
				if(gameinfo["level1"].wordRules.length>0) {
					createNewWordTask();
					if(_.isNumber(game.wordInterval)) {
						game.wordInterval = setInterval(function(){addWord()}, gameinfo["level1"].wordInterval);
					} else {
						if(game.wordInterval == 'manual') {
							$(document).bind('keydown', 'S',function (evt){  
								addWord();
								return false;
							});

						}
					}					
					/*
					game.wordInterval = setInterval(function() {
						addWord();
					},gameinfo["level1"].wordInterval);
					*/
				}
			}

			if(gameinfo["level1"].matchRule == "memory") {
				console.log("memory");
				Crafty.e("2D, DOM, Image, sign").attr({x: 190, y: 5, z: 1000});
				var taskLabel = Crafty.e("TaskLabel").taskLabel(195, 10, gameinfo["level1"].memoryStart, '#FFFFFF');
				createNewMemoryTask(true);

				//game.wordInterval = setInterval(function(){addMemory()},gameinfo["level1"].wordInterval);

				if(_.isNumber(game.wordInterval)) {
					game.wordInterval = setInterval(function(){addMemory()}, gameinfo["level1"].wordInterval);
				} else {
					if(game.wordInterval == 'manual') {
						$(document).bind('keydown', 'S',function (evt){  
							addMemory();
							return false;
						});

					}
				}					

			}

			if(gameinfo["level1"].matchRule == "fraction") {
				Crafty.e("2D, DOM, Image, sign").attr({x: 190, y: 5, z: 1000});
				var taskLabel = Crafty.e("TaskLabel").taskLabel(195, 10, "task", '#FFFFFF');
				if(gameinfo["level1"].fractionRules.length>0) {
					createNewTask();
					if(_.isNumber(game.wordInterval)) {
						game.fractionInterval = setInterval(function(){addFraction()}, gameinfo["level1"].wordInterval);
					} else {
						if(game.wordInterval == 'manual') {
							$(document).bind('keydown', 'S',function (evt){  
								addFraction();
								return false;
							});

						}
					}					
					//game.fractionInterval = setInterval(function(){addFraction()},5000);
				}
			}

			if(gameinfo["level1"].platformType == "air"){
				//player = Crafty.e("2D, Canvas, Multiway,"+playerImg).attr({x: 110, y: 100, z: 1000}).multiway(8, { SPACE: -90});
				player = Crafty.e("2D, Canvas, Multiway,"+playerImg).attr({x: 110, y: 100, z: 1000}).multiway({x:3,y:8}, {SPACE: -90, RIGHT_ARROW: 0, LEFT_ARROW: 180});

				player.bind("EnterFrame", function(frame) {
					player.y+=game.ymov;
					if(player.y<10){
						game.gravity+=0.005;
					}else{
						game.gravity=0.05;
					}
					if(game.ymov<4){
						game.ymov+=game.gravity;
					}
					
					if(player.y>760){
						game.lives--;
						utils.playSound("dead");
						Crafty("numfish").each(function(i) {
							this.destroy();
						});
						player.y = 100;
						Crafty("Lives").text(game.lives);
						if(game.lives<=0){
							killParallaxTweens();
							playerDead = true;
							Crafty.scene('gameover');
						}
					} 
				})
				Crafty.stage.elem.onMouseDown = function(e) {
					if(player.y>0){
						if(game.ymov>4){
							game.ymov-=3;
						}
						if(game.ymov<=4 && game.ymov>1){
							game.ymov-=2;
						}
						if(game.ymov<=1){
							game.ymov-=1;
						}
						if(game.ymov<-5){
							game.ymov=-5;
						}
					}
				}
				Crafty.addEvent(Crafty.stage.elem, Crafty.stage.elem, "mousedown", Crafty.stage.elem.onMouseDown);
			} else {
		       	//player = Crafty.e("2D, Canvas, Physics, Player, Gravity, Keyboard, Collision,"+playerImg).attr({x:110, y:100, z: 1001});
		       	player = Crafty.e("2D, Canvas, Physics, Player, Gravity, Keyboard, Collision, Multiway,"+playerImg).attr({x:110, y:100, z: 1001}).multiway(3, {RIGHT_ARROW: 0, LEFT_ARROW: 180});
				player.bind('KeyDown', function (e) { 
					if (this.isDown('SPACE')) jump();
				});

		        Crafty.stage.elem.onMouseDown = function(e) {
					jump();
				};
				Crafty.addEvent(Crafty.stage.elem, Crafty.stage.elem, "mousedown", Crafty.stage.elem.onMouseDown);

				player.bind("EnterFrame", function(frame) {
					if (game.isJumping) {
		       			game.yVel += game.groundGravity;
		        		this.y += game.yVel;
		        
		        		if (this.y > game.characterGround) {
		           			this.y = game.characterGround;
		            		game.yVel = 0;
		            		game.isJumping = false;
		        		}
		   			 } 
				})
			}
			
			// #### new
			function handleKeyDown(e) {
				//console.log("key: "+e.keyCode)
			    switch (e.keyCode) {
			        case game.KEYCODE_UP:
			            jump();
			        break;
			    }
			}

			function jump() {
				//console.log("jump should start & isJumping = "+game.isJumping);
			    if (game.isJumping == false) {
			        //game.yVel = gameinfo["level1"].jumpPower;
			        game.yVel = -40; // this is set in stone for now
			        game.isJumping = true;
			    }
			}

			
			
			function initScroll(){
				
				p1tween1=TweenLite.to(p1_1._element, game.p1_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeHandler});
				p1tween2=TweenLite.to(p1_2._element, game.p1_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeHandler2});
					
				p2tween1=TweenLite.to(p2_1._element, game.p2_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeMountain});
				p2tween2=TweenLite.to(p2_2._element, game.p2_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeMountain2});
					
				p3tween1=TweenLite.to(p3_1._element, game.p3_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeSky});
				p3tween2=TweenLite.to(p3_2._element, game.p3_speed, {left:"-1200px", ease:Linear.easeNone, onComplete:completeSky2});
				
				if(game.collectables.length>0){
					if(_.isNumber(game.itemInterval)) {
						game.collectableInterval = setInterval(function(){addCollectable()},game.itemInterval);
					} else {
						if(game.itemInterval == 'manual') {
							$(document).bind('keydown', 'W',function (evt){  
								addCollectable();
								return false;
							});

						}
					}
				}
				if(game.avoidables.length>0){
					if(_.isNumber(game.hazardInterval)) {
						game.avoidInterval = setInterval(function(){addAvoidable()}, game.hazardInterval);
					} else {
						if(game.hazardInterval == 'manual') {
							$(document).bind('keydown', 'A',function (evt){  
								addAvoidable();
								return false;
							});

						}
					}
				}
				if(gameinfo["level1"].extraLife == true){
					game.extralifeInterval = setInterval(function(){Crafty.e('ExtraLife').extralife();}, 20000);
				}
				if(gameinfo["level1"].turboSpeed == true){
					game.turboInterval = setInterval(function(){Crafty.e('TurboSpeed').turbospeed();}, 10000);
				}					
			}
			function startTurbo(){
				setTimeout(function(){endTurbo()},10000);
				p1tween1.timeScale(2);
				p1tween2.timeScale(2);	
				p2tween1.timeScale(2);
				p2tween2.timeScale(2);
				p3tween1.timeScale(2);
				p3tween2.timeScale(2);
			}
			function endTurbo(){
				game.turboMultiplier = 1;
				p1tween1.timeScale(1);
				p1tween2.timeScale(1);	
				p2tween1.timeScale(1);
				p2tween2.timeScale(1);
				p3tween1.timeScale(1);
				p3tween2.timeScale(1);
			}
			
			function killParallaxTweens(){
				TweenLite.killTweensOf(p1_1._element);
				TweenLite.killTweensOf(p1_2._element);
				TweenLite.killTweensOf(p2_1._element);
				TweenLite.killTweensOf(p2_2._element);
				TweenLite.killTweensOf(p3_1._element);
				TweenLite.killTweensOf(p3_2._element);
			}
				
			function completeHandler() { p1tween1.restart();}
		   	function completeHandler2() {p1tween2.restart();}
		   	function completeMountain() {p2tween1.restart();}
		   	function completeMountain2() {p2tween2.restart();}
		   	function completeSky() {p3tween1.restart();}
		   	function completeSky2() {p3tween2.restart();}
		   	
			Crafty.e("Score, DOM, 2D, Text")
				.attr({ x: 730, y: 15, z: 9002, w: 200, h: 20, score: 0 })
				.text(i18n.t('Score') + ": " + game.score)
				.textFont({ size: '30px', weight: 'bold' })
				.textColor(game.fontColor);
				
			Crafty.e("Lives, DOM, 2D, Text")
				.attr({ x: 45, y: 12, w: 50, z:1101, h: 20})
				.text(game.lives)
				.textFont({ size: '30px', weight: 'bold' })
				.textColor('#ffffff');				

			// ############## Collectable #################	
			function addCollectable() {
				var x;
				var y;
				var r = Math.floor(Math.random()*game.collectables.length);
				var type = game.collectables[r].type;
				var speed = game.collectables[r].speed;
				var cScore = parseInt(game.collectables[r].score);
				
				if(speed=="slow"){
					xSpeed = 2;
				}else if(speed == "average"){
					xSpeed = 4;
				}else{
					xSpeed = 7;
				}
				
				if(game.turbo){
					xSpeed=xSpeed*game.turboMultiplier;
				}
				
				x = Math.floor((Math.random()*200)+1050);
				y = Math.floor((Math.random()*400)+50);
				var dx = xSpeed;//Crafty.math.randomInt(3, 5);
				var dy = 0;
				
				var multiplyer = Crafty.math.randomInt(1, 2);
				var vertical = Crafty.math.randomInt(20, 30);
				
				var item = Crafty.e("2D, Canvas, Image, Collision,"+type).attr({x: x, y: y, z: 100, counter: 0, multiplyer: multiplyer, vertical: vertical});
				
				item.bind('EnterFrame', function () {
					this.counter++;
					if (this.x>-200){
						this.x -= dx;
					}else{
						this.destroy();
					}

					var sinY= Math.sin(this.counter/this.vertical);
					this.y += sinY*this.multiplyer;
				});
				item.onHit(playerImg, function(){ 
					Crafty.e('ScoreAnimation').scoreanimation(this.x, this.y, "+"+cScore);
					this.destroy();
					utils.playSound('coin');
					game.score+=cScore;
					Crafty("Score").text(i18n.t('Score') + ": "+game.score);
				});	
			}
			
			// ############## HAZARDS & AVOIDABLES #################	
			function addAvoidable() {
				if(gameinfo["level1"].gameMode=="survival" && game.hazardInterval>1500){
					clearInterval(game.avoidInterval);
					game.hazardInterval = game.hazardInterval * gameinfo["level1"].survivalFactor;
					game.avoidInterval = setInterval(function(){addAvoidable()}, game.hazardInterval);
				}		
				var x;
				var y;
				var r = Math.floor(Math.random()*game.avoidables.length);
				var type = game.avoidables[r].type;
				var aScore = parseInt(game.avoidables[r].score);
				var speed = game.avoidables[r].speed;
				
				if(speed=="slow"){
					xSpeed = 2;
				}else if(speed == "average"){
					xSpeed = 4;
				}else{
					xSpeed = 7;
				}
				if(game.turbo){
					xSpeed=xSpeed*game.turboMultiplier;
				}
					
				x = Math.floor((Math.random()*200)+1050);
				y = Math.floor((Math.random()*400)+50);
				var dx = xSpeed;//Crafty.math.randomInt(3, 5);
				var dy = 0;
				
				var multiplyer = Crafty.math.randomInt(0, 3);
				var vertical = Crafty.math.randomInt(20, 50);
				var item = Crafty.e("2D, Canvas, Image, Collision, avoidable, "+type).attr({x: x, y: y, z: 100, counter: 0, multiplyer: multiplyer, vertical: vertical});
			
				item.bind('EnterFrame', function () {
					this.counter++;
					if (this.x>-200){
						this.x -= dx;
					}else{
						this.destroy();
					}
					
					var sinY= Math.sin(this.counter/this.vertical);
					this.y += sinY*this.multiplyer;
				});
				item.onHit(playerImg, function(){
					Crafty.e('ScoreAnimation').scoreanimation(this.x, this.y, aScore);
					this.destroy();
					utils.playSound('wrong');
					game.score+=aScore;
					Crafty("Score").text(i18n.t('Score') + ": "+game.score); 
					hitWithHazard()
				});	
			}
			
			function hitWithHazard(){
				//Crafty.audio.play("sound_dead");
				if(gameinfo["level1"].hazardEffect == 1){
					game.lives--;  
					updateLives();
				}	
			}
			
			function addFraction(){
				var x;
				var y;
				var result;
				
				var rand = Crafty.math.randomInt(0, 100);
				if(rand<33){
					result = game.curTask;
				}else{
					var r = Math.floor(Math.random()*gameinfo["level1"].fractionRules.length);
					result = gameinfo["level1"].fractionRules[r];
				}
				var speed = "average";
				
				if(speed=="slow"){
					xSpeed = 2;
				}else if(speed == "average"){
					xSpeed = 4;
				}else{
					xSpeed = 7;
				}
				
				if(game.turbo){
					xSpeed=xSpeed*game.turboMultiplier;
				}
				
				x = Math.floor((Math.random()*200)+1050);
				y = Math.floor((Math.random()*400)+50);
				var dx = xSpeed;//Crafty.math.randomInt(3, 5);
				var dy = 0;
				/*				
				var factors = result.split("/");
				var nom = factors[0];
				var de = factors[1];
				*/
				var nom = result.numerator;
				var de = result.denominator;

				var w = 100+4+(2*(de-1));
				var cellWidth = 100/de;
				var fraction = Crafty.e("2D, Canvas, Color, Collision").attr({y:y, x:x, w:w, h:40, result: result}).color('#000000');
				fraction.attach(Crafty.e("2D, Canvas, Image, parachute").attr({y:y-94, x:x+5}));
				for(var i = 0; i<de; i++){
					var cellX = x+2+(i*cellWidth)+i*2;
					if(i<nom){
						fraction.attach(Crafty.e("2D, Canvas, Color").attr({y:y+2, x:cellX, w:cellWidth, h:36}).color('green'));
					}else{
						fraction.attach(Crafty.e("2D, Canvas, Color").attr({y:y+2, x:cellX, w:cellWidth, h:36}).color('white'));
					}
				}
				
				fraction.bind('EnterFrame', function () {
					if (this.x>-200){
						this.x -= dx;
					}else{
						this.destroy();
					}
				});
				fraction.onHit(playerImg, function(){checkFractionAnswer(this)});
			}
	
			function checkFractionAnswer(item){
				//if(item.result != game.curTask){
				if( (item.result.denominator != game.curTask.denominator) && (item.result.numerator != game.curTask.numerator) ) {
					utils.playSound('wrong');
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, gameinfo["level1"].matchPointsWrong); 
					game.score+=gameinfo["level1"].matchPointsWrong; 
				}else{
					game.score+=gameinfo["level1"].matchPointsRight;
					utils.playSound('coin');
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, "+"+gameinfo["level1"].matchPointsRight);
					createNewTask(); 
				}
				Crafty("Score").text(i18n.t('Score') + ": "+game.score); 
				item.destroy();
			}
			
			function checkPizzaAnswer(item){
				if(item.result != game.curTask){
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, gameinfo["level1"].matchPointsWrong); 
					game.score+=gameinfo["level1"].matchPointsWrong;
				}else{
					game.score+=gameinfo["level1"].matchPointsRight;
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, "+"+gameinfo["level1"].matchPointsRight);
					createNewPizzaTask();
				}
				Crafty("Score").text(i18n.t('Score') + ": "+game.score); 
				item.destroy();
			}
			
			function addWord() {
				var x;
				var y;
				var r = Math.floor(Math.random()*game.curAnswers.length);
				var task = game.curAnswers[r];
				
				var speed = "average";
				//var cScore = parseInt(game.collectables[r].score);
				
				if(speed=="slow"){
					xSpeed = 2;
				}else if(speed == "average"){
					xSpeed = 4;
				}else{
					xSpeed = 7;
				}
				
				if(game.turbo){
					xSpeed=xSpeed*game.turboMultiplier;
				}
				
				x = Math.floor((Math.random()*200)+1050);
				y = Math.floor((Math.random()*400)+50);
				var dx = xSpeed;//Crafty.math.randomInt(3, 5);
				var dy = 0;
				
				// if wrong answer has been shown too many (4) times, force right answer to be shown
				if(_.contains(game.curRightAnswers, task)) {
					answerCounter = 0;
				} else {
					answerCounter++;
				}

				if(answerCounter==4){
					answerCounter = 0;
					var rIdx = Math.floor(Math.random()*game.curRightAnswers.length);
					task = game.curRightAnswers[rIdx];
					console.log('FORCE RIGHT ANSWER!!! ' + task  );
				}
				
				//var word = Crafty.e("2D, DOM, cloud, Collision").attr({y:y, x:x, z:1000, result: w1});
				/*
				var word = Crafty.e("2D, Canvas, cloud, Collision").attr({y:y, x:x, result: task});
				word.attach(Crafty.e("2D, DOM, Text").attr({y:y+50, x:x+20, w:200, h:40, z:1001}).textFont({ size: '30px', weight: 'bold' }).textColor('#000000').css("textAlign", "center").text(task));
				*/

				var word = Crafty.e("2D, DOM, Text, Collision").attr({y:y, x:x, result: task, w:200, h:40, z:1001}).textFont({ size: '30px', weight: 'bold' }).textColor(game.fontColor).css("textAlign", "center").text(task);


				word.bind('EnterFrame', function () {
					if (this.x>-200){
						this.x -= dx;
					}else{
						this.destroy();
					}
				});
				word.onHit(playerImg, function(){checkWordAnswer(this)});
			}

			function addMemory(){
				var x;
				var y;
				var task;
				var r = Crafty.math.randomInt(0, 100);
				if(r>40){
					task = game.curTask;
				}
				if(r<10){
					task = game.curTask + Crafty.math.randomInt(1, 10);
				}
				if(r>=10 && r<20){
					task = game.curTask + gameinfo["level1"].memoryIncrease;
				}
				if(r>=20 && r<30){
					task = game.curTask - gameinfo["level1"].memoryIncrease;
				}
				if(r>=30 && r<=40){
					task = game.curTask + 2*gameinfo["level1"].memoryIncrease;
				}
				
				var speed = "average";
				//var cScore = parseInt(game.collectables[r].score);
				
				if(speed=="slow"){
					xSpeed = 2;
				}else if(speed == "average"){
					xSpeed = 4;
				}else{
					xSpeed = 7;
				}
				
				if(game.turbo){
					xSpeed=xSpeed*game.turboMultiplier;
				}
				
				x = Math.floor((Math.random()*200)+1050);
				y = Math.floor((Math.random()*400)+50);
				var dx = xSpeed;
				var dy = 0;
				/*
				var brain = Crafty.e("2D, Canvas, cloud, Collision").attr({y:y, x:x, z:1000, result: task});
				brain.attach(Crafty.e("2D, DOM, Text").attr({y:y+50, x:x+20, w:200, h:40, z:1000}).textFont({ size: '30px', weight: 'bold' }).textColor('#000000').css("textAlign", "center").text(task));
				*/
				var brain = Crafty.e("2D, DOM, Text, Collision").attr({y:y, x:x, result: task, w:200, h:40, z:1000}).textFont({ size: '30px', weight: 'bold' }).textColor(game.fontColor).css("textAlign", "center").text(task);

				brain.bind('EnterFrame', function () {
					if (this.x>-200){
						this.x -= dx;
					}else{
						this.destroy();
					}
				});
				brain.onHit(playerImg, function(){checkMemoryAnswer(this)});
			}	
				
			function checkWordAnswer(item){
				console.log("checkAnswer");
				console.log(item.result + " : "+game.curTask);
				if( _.contains(game.curRightAnswers, item.result) ) {
					utils.playSound('coin');
					game.score+=gameinfo["level1"].matchPointsRight; 
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, "+"+gameinfo["level1"].matchPointsRight);
					createNewWordTask();
				} else {
					utils.playSound('wrong');					
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, gameinfo["level1"].matchPointsWrong); 
					game.score+=gameinfo["level1"].matchPointsWrong;
				}
				/*
				if(item.result != game.curAnswer){
					utils.playSound('wrong');					
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, gameinfo["level1"].matchPointsWrong); 
					game.score+=gameinfo["level1"].matchPointsWrong; 
				} else {
					utils.playSound('coin');
					game.score+=gameinfo["level1"].matchPointsRight; 
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, "+"+gameinfo["level1"].matchPointsRight);
					createNewWordTask(); 
				}
				*/
				Crafty("Score").text(i18n.t('Score') + ": "+game.score); 
				item.destroy();
			}
			
			function checkMemoryAnswer(item){
				console.log(item.result + " : "+game.curTask);				
				if(item.result != game.curTask){
					utils.playSound('wrong');
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, gameinfo["level1"].matchPointsWrong); 
					game.score+=gameinfo["level1"].matchPointsWrong;
				}else{
					utils.playSound('coin');
					game.score+=gameinfo["level1"].matchPointsRight;
					Crafty.e('ScoreAnimation').scoreanimation(item.x, item.y, "+"+gameinfo["level1"].matchPointsRight);
					createNewMemoryTask(false); 
				}
				Crafty("Score").text(i18n.t('Score') + ": "+game.score); 
				item.destroy();
			}

			function updateLives(){
				if(game.lives<=0){
					Crafty("Lives").text(game.lives);
					killParallaxTweens();
					playerDead = true;
					Crafty.scene('gameover');
				} else {
					Crafty("Lives").text(game.lives);
				}
			}

			// ############ TASK STUFF #######################
			function createNewTask(){
				var r = Crafty.math.randomInt(0, gameinfo["level1"].fractionRules.length-1);
				game.curTask = gameinfo["level1"].fractionRules[r];
				taskLabel.changeTask(game.curTask.numerator + "/" + game.curTask.denominator);
			}
			
			function createNewPizzaTask(){
				var r = Crafty.math.randomInt(0, gameinfo["level1"].pizzaRules.length-1);
				game.curTask = gameinfo["level1"].pizzaRules[r];
				console.log("curTask"+game.curTask);
				taskLabel.changeTask(game.curTask);
			}
			
			function createNewWordTask() {
				// TODO: store last task eref -> if same again, take some other, if only one, take that
				game.curAnswers = [];
				var r = Crafty.math.randomInt(0, gameinfo.level1.wordRules.length-1);
				var task = gameinfo.level1.wordRules[r];
				if( gameinfo.level1.wordRules.length == 1 || (gameinfo.level1.wordRules.length > 1 && task.eref != game.curTaskEref) ) {
					game.curTaskEref = task.eref;

					_.each(gameinfo.level1.wordRules[r].rightArr, function(rightAnswer, index, list) {
						game.curAnswers.push(rightAnswer);
					});
				
					_.each(gameinfo.level1.wordRules[r].wrongArr, function(wrongAnswer, index, list) {
						game.curAnswers.push(wrongAnswer);
					});

					var w1 = task.task;
					game.curRightAnswers = gameinfo.level1.wordRules[r].rightArr;
					game.curTask = w1;
					taskLabel.changeTask(game.curTask);
				} else {
					// don't show same task twice in a row
					createNewWordTask();
				}
			}
			
			function createNewMemoryTask(first) {
				if(first) {
					game.curTask = gameinfo["level1"].memoryStart+gameinfo["level1"].memoryIncrease;
					taskLabel.changeTask(gameinfo["level1"].memoryStart+"+"+gameinfo["level1"].memoryIncrease);
				} else {
					game.curTask += gameinfo["level1"].memoryIncrease;
					taskLabel.changeTask("Go for it!");
				}
			}
			
			Crafty.c('TurboSpeed', {
				turbospeed: function() {
					this.requires("2D, Canvas, Image, Collision, speedmeter");
			      	this.x = Math.floor((Math.random()*200)+1050);
			      	this.y = Math.floor((Math.random()*400)+50);
			        this.z = 1000;
			        this.speed = 10;
			        
			        this.bind("EnterFrame", function(frame) {
			        	if (this.x>-200){
							this.x -= this.speed;
						}else{
							this.destroy();
						}
			        });       
			        this.onHit(playerImg, function(){this.destroy(); game.turbo = true; game.turboMultiplier = 3; startTurbo();});
			    }
			});
			
			// ##### MOTION STUFF #######
			if (window.DeviceMotionEvent==undefined) {
			} else {
				var motionSensitivity = (gameinfo.level1.hasOwnProperty('sensitivity')) ? parseInt(gameinfo.level1.sensitivity.motion, 10) : 10000;
				var jumpSensitivity = (gameinfo.level1.hasOwnProperty('sensitivity')) ? parseInt(gameinfo.level1.sensitivity.jump, 10) : 18000;

				window.ondevicemotion = function(event) {
					ax = Math.round(event.accelerationIncludingGravity.x*1000);
					ay = Math.round(event.accelerationIncludingGravity.y*1000);
					az = Math.round(event.accelerationIncludingGravity.z*1000);
					//event.preventDefault();
				}
				setInterval(function() {
					if(!activated) {						
						var xx = (ax - oldx) * (ax - oldx);
						var yy = (ay - oldy) * (ay - oldy);
						var zz = (az - oldz) * (az - oldz);
						var sum = xx + yy + zz;
						var pituus = Math.abs(Math.sqrt(sum));
						if(gameinfo["level1"].platformType == "air") {
							if (pituus > motionSensitivity) {
								if(game.ymov>4) {
									game.ymov-=3;
								}
								if(game.ymov<=4 && game.ymov>1) {
									game.ymov-=2;
								}
								if(game.ymov<=1) {
									game.ymov-=1;
								}
								if(game.ymov<-5) {
									game.ymov=-5;
								}
								oldx = ax;
								oldy = ay;
								oldz = az;
							} else {
								oldx = ax;
								oldy = ay;
								oldz = az;
							}
						} else {
							if (pituus > jumpSensitivity) {
								jump();
								oldx = ax;
								oldy = ay;
								oldz = az;	
							} else {	
								oldx = ax;
								oldy = ay;
								oldz = az;
							}
						}
					}
				}, delay);
			}

			setTimeout(function() {
				initScroll()
			}, 1000);
			
		});

		// ############  GAMEOVER SCENE ################
		Crafty.scene('gameover', function() {
			Crafty.background("#333333");
			game.clearIntervals();
			var curlevel = "level "+game.level;
			var timeBonus = 0;
			
			game.stars = 0;
			if(!playerDead || game.gameMode == "survival"){
				if(game.score>parseInt(gameinfo["level1"].star3limit)){
					game.stars = 3;
				}else if(game.score>parseInt(gameinfo["level1"].star2limit)){
					game.stars = 2;
				}else if(game.score>parseInt(gameinfo["level1"].star1limit)){
					game.stars = 1;
				}else{
					game.stars = 0;
				}
				
				/*game.endTime = new Date();
				var secondsElapsed = Math.round((game.endTime - game.startTime) / 1000);
				console.log("s"+secondsElapsed);
				if(secondsElapsed<game.bonustimelimit){
					timeBonus = (game.bonustimelimit-secondsElapsed)*100;
					game.score+=timeBonus;
				}else{
					timeBonus = 0;
				}*/
			}
			
			var feedbackText = '';
			var titleText = i18n.t('Game over') + "! ";

			if(playerDead){
				if(game.gameMode == "time") {
					feedbackText += i18n.t("time_feedback_fail");
				}
				if(game.gameMode == "distance") {
					feedbackText += i18n.t("distance_feedback_fail", { postProcess: 'sprintf', sprintf: [game.reached] });
				}
			} else {
				titleText = i18n.t('Well done') + "! ";
				if(game.gameMode == "distance") {
					feedbackText += i18n.t("distance_feedback_success", { postProcess: 'sprintf', sprintf: [game.reached] });
				} else if(game.gameMode == "time") {
					feedbackText += i18n.t("time_feedback_success", { postProcess: 'sprintf', sprintf: [gameinfo.level1.gameDuration] });
				}
			}
			if(game.gameMode == "survival") {				
				feedbackText += i18n.t("survival_feedback_text", { postProcess: 'sprintf', sprintf: [game.reached] });
			} 
			
			var hscore = game.updateHighscore (game.level, game.score);
			var hstars = game.updateHighStars (game.level, game.stars);
			
			var scorebg = Crafty.e("2D, DOM, Image, Mouse, scorebg").attr({x: 112, y: 130});
			//var menubtn = Crafty.e("2D, DOM, Image, Mouse, menubtn").attr({x: 700, y: 567, z:1000});
			var stage = $('#cr-stage');

			var menuBtn = $('<button>');
			menuBtn.attr('id', 'menuBtn');
			menuBtn.addClass('btn btn-warning magosLiteBtn');
			menuBtn.css({color: game.fontColor });
			menuBtn.text(i18n.t('Back to menu'));
			stage.append(menuBtn);
			menuBtn.click(function() {
				$('#menuBtn').remove();
				$(Crafty.canvas._canvas).remove();
				Crafty.scene('intro');
			});
			
			/*
			if(game.score>=hscore){
				Crafty.e("2D, DOM, Image, newhighscore").attr({x: 600, y: 400});
			}
			Crafty.e("HighText, DOM, 2D, Text")
			.attr({ x: 550, y: 146, w: 400, h: 30 })
			.text("Highscore: "+hscore)
			.textFont({ size: '30px', weight: 'bold' })
			.textColor('#FFFFFF');
			*/
			Crafty.e("LevelText, DOM, 2D, Text")
				.attr({ x: 180, y: 165, w: 400, h: 50 })
				.text(titleText)
				.textFont({ size: '50px', weight: 'bold' })
				.textColor('#FFFFFF');
			
			/*Crafty.e("BonusText, DOM, 2D, Text")
			.attr({ x: 200, y: 380, w: 400, h: 30 })
			.text("Time bonus: "+timeBonus)
			.textFont({ size: '30px', weight: 'bold' })
			.textColor('#FFFFFF');*/
			
			Crafty.e("CurScoreText, DOM, 2D, Text")
				.attr({ x: 200, y: 470, w: 400, h: 30 })
				.text(i18n.t('Final score') + ": "+game.score)
				.textFont({ size: '30px', weight: 'bold' })
				.textColor('#FFFFFF');

			Crafty.e("FeedbackText, DOM, 2D, Text")
				.attr({ x: 200, y: 300, w: 400, h: 40 })
				.text(feedbackText)
				.textFont({ size: '30px', weight: 'bold' })
				.textColor('#FFFFFF');
			
			for(var j=0; j<3; j++){
				//Crafty.e("2D, DOM, Image, star-dark").attr({x: 550+(j*70), y: 185});
				Crafty.e("2D, DOM, Image, star-dark").attr({x: 200+(j*70), y: 520});
			}
			
			for(var i=0; i<game.stars; i++){
				var star = Crafty.e("2D, DOM, Image, star").attr({x: 200+(i*70), y: 520});
			}
			/*
			for(var s=0; s<hstars; s++){
				Crafty.e("2D, DOM, Image, star").attr({x: 550+(s*70), y: 185});
			}
			if(game.score>hscore){
				Crafty.e("2D, DOM, Image, newhighscore").attr({x: 550, y: 500});
			}
			*/
			/*
			menubtn.bind('Click', function() {
				$(Crafty.canvas._canvas).remove();
				Crafty.scene('intro');
			});
			*/
			
			
		});

		Crafty.scene('preloadgame');

	},

	clearIntervals: function() {
		clearInterval(game.avoidInterval);
		clearInterval(game.collectableInterval);
		if(gameinfo["level1"].extraLife == true){
			clearInterval(game.extralifeInterval);
		}
		if(gameinfo["level1"].turboSpeed == true){
			clearInterval(game.turboInterval);
		}	
		if(gameinfo["level1"].extraLife == true){
			clearInterval(game.extralifeInterval);
		}
		if(gameinfo["level1"].matchRule == "fraction"){
			clearInterval(game.fractionInterval);
		}
		if(gameinfo["level1"].matchRule == "word" || gameinfo["level1"].matchRule == "memory" || gameinfo["level1"].matchRule == "pizza"){
			clearInterval(game.wordInterval);
		}
	},

	// APUSETTIA ##################
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
	  		game.storable=true;
	  	}else{
	  		console.log("Sorry! No web storage support..");
	  		game.storable=false;
	  	}
	},

	updateHighscore: function(lev, newscore){
		var highscore = localStorage.getItem(['Highscore_l'+lev]); 
		if(highscore) {
	    	console.log("up high :"+localStorage['Highscore_l'+lev]);
	    	if(highscore<newscore){
	    		localStorage['Highscore_l'+lev] = newscore;
	    		return newscore;
	    	}else{
	    		return highscore;
	    	}
		} else {
	    	localStorage['Highscore_l'+lev]=newscore;
	    	return newscore;
		}
	},	

	updateHighStars: function(lev, newstars){
		var highstars = localStorage.getItem(['Highstars_l'+lev]); 
		console.log("up stars alku:"+highstars+" "+lev);
		if(highstars) {
	    	console.log(localStorage['Highstars_l'+lev]);
	    	if(highstars<newstars){
	    		localStorage['Highstars_l'+lev] = newstars;
	    		return newstars;
	    	}else{
	    		return highstars;
	    	}
		}
		else {
			console.log("s else ");
	    	localStorage['Highstars_l'+lev]=newstars;
	    	return newstars;
		}
	},

	localToEditor: function(obj){
		// Retrieve the object from storage
		var retrievedObject = localStorage.getItem(obj);
		var parsedGame = JSON.parse(retrievedObject);
		game.gameinfo = parsedGame;
		game.getGameData();
	},

	getGameData: function(){
		game.title = gameinfo["level1"].title;
		game.instructions = gameinfo["level1"].instructions;
		playerImg = gameinfo["level1"].playerImg;
		game.sky = gameinfo["level1"].sky;
		game.itemInterval = gameinfo["level1"].itemInterval;
		game.hazardInterval = gameinfo["level1"].hazardInterval;
		
		game.p1 = gameinfo["level1"].scroll[0].item;
		game.p2 = gameinfo["level1"].scroll[1].item;
		game.p3 = gameinfo["level1"].scroll[2].item;
		game.p1_speed = gameinfo["level1"].scroll[0].speed;
		game.p2_speed = gameinfo["level1"].scroll[1].speed;
		game.p3_speed =gameinfo["level1"].scroll[2].speed;
		
		game.gameMode = gameinfo["level1"].gameMode;
		game.meters = gameinfo["level1"].goalDistance;
		
		var amount = gameinfo["level1"].collectables.length;
		for(var i=0; i<amount; i++){
			game.collectables.push(gameinfo["level1"].collectables[i]);
		}
		for(var j=0; j<gameinfo["level1"].hazards.length; j++){
			game.avoidables.push(gameinfo["level1"].hazards[j]);
		}
		game.bonustimelimit = gameinfo["level1"].bonustimelimit;
		Crafty.scene('intro');
	},

	addExplosion: function(X,Y){
		var expl = Crafty.e("2D,Canvas,Particles").particles(explosion).attr({ x: X, y: Y, z: 1000});
        var counter = 0;
        /*
        expl.bind("EnterFrame", function(frame) {
        	counter++;
        	if(counter<100){
        		this.x -= 3;
        		this.y += 1;
            } else {
            	expl.unbind("EnterFrame");
            }
        });
		*/
	}

} // game

function addGraphics(){
	/*
	Crafty.e("2D, DOM, Image,itemhelp").attr({x: 420, y: 30, z: 1000});
	Crafty.e("2D, DOM, Image,playerhelp").attr({x: 100, y: 150, z: 1000});
	Crafty.e("2D, DOM, Image,player_ref,"+gameinfo["level1"].playerImg).attr({x: 80, y: 200, z: 1000});
	Crafty.e("2D, DOM, Image,p3_ref,"+gameinfo["level1"].scroll[2].item).attr({x: 0, y: editor.p3y, z: 8});
	Crafty.e("2D, DOM, Image,p2_ref,"+gameinfo["level1"].scroll[1].item).attr({x: 0, y: editor.p2y, z: 9});
	Crafty.e("2D, DOM, Image,p1_ref,"+gameinfo["level1"].scroll[0].item).attr({x: 0, y: editor.p1y, z: 10});
	Crafty.e("2D, DOM, Image, sky_ref,"+gameinfo["level1"].sky).attr({x: 0, y: 0, z:0});
	*/
}


Crafty.c('GameTimer', {
	gametimer: function(seconds) {
		this.requires("2D, DOM, Text");
      	this.x = 540;
      	this.y = 15;
        this.timeWas = 0;
        this.timeNow = 0;
        this.timeLeft = seconds;
        this.w = 300;
        this.h = 30;
		this.textFont({ size: '30px', weight: 'bold' });
		//this.css("textShadow", "2px 2px #ffffff");
		this.textColor(game.fontColor);
        this.interval = setInterval('Crafty.trigger("Tick")', 1000);
        this.text(i18n.t('Time') + ": " + this.timeLeft);
        this.bind("StopTimer", function() {
            clearInterval(this.interval);
        })
        .bind("Tick", function() {
            var kello = new Date();
        	this.timeNow = Math.floor(kello.getTime()/1000);
            if (this.timeNow > this.timeWas) {
                if (this.timeLeft > 0) {
                    this.timeLeft -= 1;
                        if (this.timeLeft < 11) {
                            if (this.timeLeft > 0) {
                                //Crafty.audio.play("time_running");
                            } else {
                            	//Crafty.audio.play("time_out");
                            	//console.log("time is up");
                            	Crafty.scene('gameover');
                            }
                        }
                	}
                	this.text(i18n.t('Time') + ": " + this.timeLeft);
                }
                this.timeWas = this.timeNow;
        });
    }
});
Crafty.c('GameClock', {
	gameclock: function() {
		this.requires("2D, DOM, Text");
      	this.x = 540;
      	this.y = 15;
        this.clock = new Date();
        this.timeStart= Math.floor(this.clock.getTime()/1000);
        this.duration = 0;
        this.w = 300;
        this.h = 30;
		this.textFont({ size: '30px', weight: 'bold' });
		this.textColor(game.fontColor);
		//this.css("textShadow", "2px 2px #ffffff");
        this.interval = setInterval('Crafty.trigger("Tick")', 1000);
        this.text(i18n.t('Time') + ": " + this.duration);
        this.bind("StopTimer", function() {
            clearInterval(this.interval);
        })
        .bind("Tick", function() {
            var kello = new Date();
        	this.duration = (Math.floor(kello.getTime()/1000))-this.timeStart;
            this.text(i18n.t('Time') + ": " + this.duration);
            game.reached = this.duration;
        });
    }
});
Crafty.c('DistanceMeter', {
	distancemeter: function() {
		this.requires("2D, DOM, Text");
      	this.x = 500;
      	this.y = 15;
        this.meter = 0;
        this.goal = gameinfo["level1"].goalDistance;
        this.w = 400;
        this.h = 30;
		this.textFont({ size: '30px', weight: 'bold' });
		this.textColor(game.fontColor);
        this.text(this.meter + " m / " + this.goal + " m");
        this.counter = 0;
        this.bind("EnterFrame", function(frame) {
        	this.counter++;
        	if(this.counter%4==0){
        		this.meter += 1*game.turboMultiplier;
        		game.reached = this.meter;
            	this.text(this.meter+" m / " + this.goal+ " m");
            	if(this.meter >= this.goal){
            		Crafty.scene('gameover');
            	}
            }
        });
    }
});

Crafty.c('ExtraLife', {
	extralife: function() {
		this.requires("2D, Canvas, Image, Collision, heart");
      	this.x = Math.floor((Math.random()*200)+1050);
      	this.y = Math.floor((Math.random()*400)+50);
        this.z = 1000;
        this.speed = 6;
        
        this.bind("EnterFrame", function(frame) {
        	if (this.x>-200){
				this.x -= this.speed;
			}else{
				this.destroy();
			}
        });       
        this.onHit(playerImg, function(){this.destroy(); game.lives++; Crafty("Lives").text(game.lives);});
    }
});


Crafty.c('TaskLabel', {
	__w: 280,
	__h: 110,
	__z: 1000,
				
	taskLabel: function(start_x, start_y, task, tColor) {
		this.requires("2D, DOM, Text, taskLabel");
      	this.x = start_x;
      	this.y = start_y;
      	this.w = this.__w;
      	this.h = this.__h;
      	this.z = this.__z;
      	this.text(task);
      	this.textFont({ size: '30px', weight: 'bold'});
      	this.css("textAlign", "center");
		this.textColor(tColor);
      	return this; // make chainable
	},
	changeTask: function(newTask){
		//console.log("change");
		this.text(newTask);
	}			
});

Crafty.c("ScoreAnimation", {
    scoreanimation: function(_x, _y, _points) {
        if(_points!=0){
        	this.requires("2D, DOM, Text");
       	 	this.x = _x;
       		this.y = _y;
       		this.z = 5000;
       	 	this.text(_points);
       	 	this.textFont({ size: '30px', weight: 'bold' });
			this.textColor(game.fontColor);
     		TweenLite.to(this._element, 2, {scale:2, ease:Linear.easeNone, onComplete:completeScore, onCompleteParams:[this]});
     	}
     }
});

function completeScore(item) {
	item.destroy();
}