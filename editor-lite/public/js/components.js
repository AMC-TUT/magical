Crafty.c('Coinfish', {
	coinfish: function(_x, _y) {
		this.requires("2D, DOM, SpriteAnimation, Collision, coinfish");
		this.x = _x;
   		this.y = _y;
		this.z = 10;
	
		this.animate('CoinSwim', 0, 0, 3) //setup animation - frames
   		this.animate('CoinSwim', 15, -1) // start animation  - nopeus
   		
   		this.onHit('playerfish', function(){this.destroy(); Crafty.audio.play("sound_coin"); coinAmount++; totalcoins++; Crafty("Coins").text(": "+coinAmount);});
   		
   		this.bind('EnterFrame', function () {
			if (this.x>-80){
				this.x -= 5;
			}else{
				this.destroy();
			}
		});
	}
	/*magnetoState: function() {
		var cointween=TweenLite.to(this._element, 1, {up:"100px", ease:Linear.easeNone, onComplete:completeHandler});
	},
	completeHandler: function() {
		//item.destroy();
   	}*/	
});

Crafty.c('BlackBird', {
	blackbird: function(_x, _y) {
		this.requires("2D, DOM, SpriteAnimation, Collision, blackbird");
		this.x = _x;
   		this.y = _y;
		this.z = 10;
	
		this.animate('CoinSwim', 0, 0, 3) //setup animation - frames
   		this.animate('CoinSwim', 15, -1) // start animation  - nopeus
   		
   		this.onHit('playerfish', function(){this.destroy(); Crafty.audio.play("sound_coin"); coinAmount++; totalcoins++; Crafty("Coins").text(": "+coinAmount);});
   		
   		this.bind('EnterFrame', function () {
			if (this.x>-80){
				this.x -= 5;
			}else{
				this.destroy();
			}
		});
	}
	/*magnetoState: function() {
		var cointween=TweenLite.to(this._element, 1, {up:"100px", ease:Linear.easeNone, onComplete:completeHandler});
	},
	completeHandler: function() {
		//item.destroy();
   	}*/	
});

Crafty.c('CoinFishSet', {
	coinfishset: function() {
		this.requires("2D, DOM, SpriteAnimation, coinfishset, Coin");
		this.x = 1100;
    	this.y = 0;
		this.z = 10;
		var r = Crafty.math.randomInt(0, 4);
		var coinSetTypes = ["4*2","2*2","2*4","3*1","3*2"];
		var type = coinSetTypes[r];
		
		switch(type){
			case "4*2":
				var ry = Crafty.math.randomInt(1, 4)*100;
				for(var i=0; i<4; i++){
					Crafty.e("Coinfish").coinfish(1100+(i*80), 120);
					Crafty.e("Coinfish").coinfish(1100+(i*80), 180);
				}
				
			break;
			
			case "2*2":
				var ry = Crafty.math.randomInt(1, 4)*100;
				for(var i=0; i<2; i++){
					Crafty.e("Coinfish").coinfish(1100+(i*100), 120);
					Crafty.e("Coinfish").coinfish(1100+(i*100), 180);
				}
				
			break;
			
			case "2*4":
				var ry = Crafty.math.randomInt(1, 2)*100;
				for(var i=0; i<2; i++){
					Crafty.e("Coinfish").coinfish(1100+(i*80), 120);
					Crafty.e("Coinfish").coinfish(1100+(i*80), 180);
					Crafty.e("Coinfish").coinfish(1100+(i*80), 240);
					Crafty.e("Coinfish").coinfish(1100+(i*80), 300);
				}
				
			break;
			
			case "3*1":
				var ry = Crafty.math.randomInt(1, 5)*100;
				for(var i=0; i<3; i++){
					Crafty.e("Coinfish").coinfish(1100+(i*80), ry);
					Crafty.e("Coinfish").coinfish(1100+(i*80), ry);
					Crafty.e("Coinfish").coinfish(1100+(i*80), ry);
				}
				
			break;
			
			case "3*2":
				for(var i=0; i<3; i++){
					Crafty.e("Coinfish").coinfish(1100+(i*80), 200);
					Crafty.e("Coinfish").coinfish(1100+(i*80), 600);
				}
			break;
		}
		
   	this.bind('EnterFrame', function () {
					if (this.x>-80){
						this.x -= 5;
					}else{
						this.destroy();
					}
				});
	}
});


Crafty.c('Animation', {
	init: function() {
		this.requires('2D, DOM, SpriteAnimation');
	},
	//Set up an animation
	animation: function(spriteObject) {
		var urlParts = spriteObject.url.split('/');
		var spriteId = urlParts[urlParts.length - 1].split('.')[0];
		console.log(spriteId, spriteObject);
		this.addComponent(spriteId);
		this._spriteObject = spriteObject;
		
		for(var animationId in spriteObject) {
			if(animationId != 'image' && animationId != 'url' && animationId != 'type') {
				var animationObject = spriteObject[animationId];

				//Animation is defined as frames, like {frames: [[0, 0], [1, 0], [2, 0]]}
				if(animationObject.frames) {
					this.animate(animationId, animationObject.frames);
				}
				//Animation is defined "normally", like {x:0, toX:2} or there is no animation (a picture with multiple states)
				else if(animationObject.toX === undefined || animationObject.x <= animationObject.toX) {
					this.animate(animationId, animationObject.x, animationObject.y, animationObject.toX || animationObject.x);
				}
				//Animation is defined "normally" but it flows into "wrong" direction, like {x:2, toX:0}
				else {
					var frames = new Array();
					
					for(var i=animationObject.x; i>=animationObject.toX; i--) {
						frames.push([animationObject.toX + i, animationObject.y]);
					}
					this.animate(animationId, frames);
				}
			}
		}
		return this;
	},
	//Play animation with frameId
	//Do not restart the animation already playing unless restart is true, endFunction (if defined) is a callback once animation finishes
	play: function(frameId, restart, endFunction) {
		if((arguments.length > 1 && restart === true) || !this.isPlaying(frameId)) {
			var animationObject = this.getAnimationObject(frameId);
			
			if(animationObject) {
				if(this.isPlaying()) {
					this.stop();
				}
				this.animate(frameId, animationObject.duration || 1, animationObject.repeats || 0);

				if(arguments.length > 2) {
					//this.bind('AnimationEnd', endFunction); //Crafty bug at the moment. Had to use another method
					var repeats = (!animationObject.repeats || animationObject.repeats === -1) ? 1 : animationObject.repeats;

					this.timeout(endFunction, animationObject.duration * repeats / Crafty.timer.getFPS() * 1000);
				}
			}
			else {
				//console.log('animationObject has no frameId "'+frameId+'"');
			}
		}
		return this;
	},
	getAnimationObject: function(frameId) {
		return this._spriteObject[frameId] || null;
	}
});



Crafty.c('NumLabel', {
			__w: 80,
			__h: 40,
			__z: 200,
				
			numLabel: function(start_x, start_y, aNum, tColor) {
				console.log(aNum)
				this.requires("2D, DOM, Text, numLabel");
      			this.x = start_x;
      			this.y = start_y;
      			this.w = this.__w;
      			this.h = this.__h;
      			this.z = this.__z;
      			this.text(aNum);
      			this.textFont({ size: '30px', weight: 'bold' })
				this.textColor(tColor);
      			return this; // make chainable
			}
});

Crafty.c('TaskLabel', {
	__w: 120,
	__h: 40,
	__z: 10,
				
			taskLabel: function(start_x, start_y, task, tColor) {
				this.requires("2D, DOM, Text, taskLabel");
      			this.x = start_x;
      			this.y = start_y;
      			this.w = this.__w;
      			this.h = this.__h;
      			this.z = this.__z;
      			this.text(task);
      			this.textFont({ size: '30px', weight: 'bold' })
				this.textColor(tColor);
      			return this; // make chainable
			},
			changeTask: function(newTask){
				console.log("change");
				this.text(newTask);
			}
			
			
});

console.log("components");