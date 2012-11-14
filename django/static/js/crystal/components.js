
Crafty.c("CrystalBall", {
    moveCounter : 0,
    init: function() {
        this.requires("2D, DOM, Mouse, Text, Player, Draggable, Tween, crystalBall");
    	var playerWidth = 300, playerHeight = 300,
			playerX = (Game.width/2) - (playerWidth/2),
			playerY = (Game.height/2) - (playerHeight/2);
        this.x = playerX;
        this.y = playerY;
        this.oldX = playerX; 
        this.oldY = playerY;
        this.width = playerWidth;
        this.height = playerHeight;
        this.moveCounter = 0;
        // ShowWord event
        this.bind('ShowWord', function(id) {
        	//console.log(Game.stage);
        	var wordType = Game.stages[id].wordType;
        	var wordList = Game.words[wordType];
        	//if()
			var word = wordList[Math.floor(Math.random() * wordList.length)].word;
			Game.usedWords[wordType] = word;
        	Crafty.trigger('SetWord', word);
        });
        this.bind('SetWord', function(word) {
        	this.text(word);
        });
	    // StartDrag event
        this.bind("StartDrag", function(e) {
			Crafty.trigger('SetWord', '');
	    });
	    // StopDrag event
	    this.bind("StopDrag", function(e) {
			//not implemented
	    });
	    // EnterFrame event
		this.bind("EnterFrame", function(frame) {
			//not implemented
		});
        // Dragging event
        this.bind("Dragging", function(e) {
			//console.log(player.x + ' - '+ player.oldX);
			this.moveCounter++;
			//console.log(this.moveCounter);
			if(this.moveCounter >= 100) {
				this.moveCounter = 0;
				this.disableDrag();
				// tween ball to center
				this.tween({x: this.oldX, y: this.oldY}, 10);
				// move to next stage
				Game.stage++;
				//console.log('Stage # ' + Game.stage);

				if(Game.stage < 7) {
					// show word on a ball
					Crafty.trigger("ShowWord", Game.stage);
					// update info text
					Crafty.trigger("ShowText", Game.stage);
					// update info text
					Crafty.trigger("SetBadgeDone", Game.stage);
					this.timeout(function() {
						Game.stage++; // move to "intermediary" stage -> drag to continue -text
						Crafty.trigger("ShowText", Game.stage);	         		
		         		// append info text
		         		this.enableDrag();
					}, 2000);

				} else {
					Crafty.scene('WriteDescription');
					/*
					Crafty.trigger("ShowText", Game.stage);
					Crafty.trigger("SetBadgeDone", Game.stage);
					showDescriptionForm();
					*/
					
				}
				
				//changeColor("-1,2,0");

			}
		});

        return this;
    }
});

Crafty.c("StageBadge", {
    init: function() {
        this.requires("2D, DOM, Text, stageBadge");
        // Mark badge as done event
        this.bind("SetBadgeDone", function(id) {
        	var badge = Game.stages[id].entity;
        	badge.addComponent("badgeDone");
       	});
    	return this;
    }
});

Crafty.c("InfoText", {
    init: function() {
        this.requires("2D, DOM, Text, infoText");
        // ShowText event
        this.bind("ShowText", function(id) { 
        	var infoText = Game.stages[id].desc;
        	this.text(infoText);
       	});
    	return this;
    }
});


Crafty.c("WordTriplet", {
    init: function() {
        this.requires("2D, DOM, Text, wordTriplet");
    	return this;
    }
});
