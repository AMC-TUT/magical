
function bindFormSend() {
	$('#description-form').bind('submit', function(e) {
        $("#sendbutton").attr('disabled', true);
		e.preventDefault();
		var myForm = e.target;
		/*console.log(myForm);
		console.log($(myForm).serialize());
		*/
        $("#ajaxwrapper").load(
            $(myForm).attr('action') + ' #ajaxwrapper',
            $(myForm).serializeArray(),
            function(responseText, responseStatus) {
                $("#sendbutton").attr('disabled', false);
                //$('#restart').click(that.restartCrystalBall);

				$(myForm).remove();
				//$('#cr-stage > div').remove(); // remove orphan DOM elements div
				// re-initialize game to overcome text input issue
				if(Game.usedWords) {
					Game.wordsHistory.push(Game.usedWords);
				}
				Crafty.scene("Game");

            }
        );

    });
}

function showUsedWords() {
	var wordsHtml = '';
	_.each(Game.usedWords, function(key, val) {
		wordsHtml += '<span class="formWord">' + key + '</span>';
	});
    $('#crystalBallWords').append(wordsHtml);
}
    
function showDescriptionForm() {
	var that = this;
	$.ajax({
        dataType : 'html',
        type : 'GET',
        url : '/crystal/description/',
        success : function(data, textStatus, jqXHR) {
            $('#cr-stage').prepend(data);
            var crystalWords = '';
            _.each(Game.usedWords, function(val, key) {
            	crystalWords += key + '=' + val + ', '
            });
            $('#id_words').val(crystalWords);
            showUsedWords();
            bindFormSend();
        },
        error : function(jqXHR, textStatus, errorThrown) {
            $('#errors').html('Error in XHR request.<br/> ' + errorThrown).show();
        }
    });
}

// Intro Scene
Crafty.scene("Intro", function() {
	Crafty.background("url(/static/img/turq-bg.jpg)");
	var startBtn = Crafty.e();
	startBtn.addComponent("CrystalBall");
	startBtn.attr({ x: 200, y: 200, z: 5, w: 407, h: 407 });
});


// Game Scene
Crafty.scene("Game", function() {
	Game.stage = 0;
	Game.usedWords = {};
	Crafty.background("url(/static/img/turq-bg.jpg)");

	// info text
	var infoText = Crafty.e("InfoText")
		.text(Game.stages[Game.stage].desc)
		.attr({
	    	x: 0,
	    	y: 150,
	    	w: Game.width
		});
	
	// create badges
	_.each(Game.stages, function(stage) {
		//console.log(stage);
		if(stage.badge) {
			var curStage = Crafty.e("StageBadge")
				.text("<span>" + stage.name + "</span>")
				.attr({x: stage._x, y: stage._y});
			stage.entity = curStage; // store entity for later use
		}
	});

	// crystall ball
	var player = Crafty.e("CrystalBall");	

	// show word triplets
	if(Game.wordsHistory.length) {
		var wordTripletY = 220;
		_.each(Game.wordsHistory.reverse(), function(words) {
			var wordsTriplet = Crafty.e("WordTriplet")
				.text(words.verbs + ", " + words.nouns + ", " + words.adjectives)
				.attr({x: 10, y: wordTripletY});
			wordTripletY += 50;
		});
	}
	
});



Crafty.scene("WriteDescription", function() {
	Crafty.background("url(/static/img/green-bg.jpg)");

	var infoText = Crafty.e("InfoText")
		.text(Game.stages[Game.stage].desc)
		.attr({
	    	x: 0,
	    	y: 150,
	    	w: Game.width
		});

	// create badges
	_.each(Game.stages, function(stage) {
		if(stage.badge) {
			var curStage = Crafty.e("StageBadge, badgeDone")
				.text("<span>" + stage.name + "</span>")
				.attr({x: stage._x, y: stage._y});
		}
	});

	showDescriptionForm();

});

