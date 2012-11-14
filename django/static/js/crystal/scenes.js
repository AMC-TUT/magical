
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
	/*
    $('#description-form').live('submit', function(e) {
		e.preventDefault();
		var myForm = e.target;
		console.log(myForm);
		console.log($(myForm).serialize());
		$(myForm).remove();
		//$('#cr-stage > div').remove(); // remove orphan DOM elements div
		// re-initialize game to overcome text input issue
		Game.usedWords = {};
		Crafty.scene("Game");
    });
	*/
	//$('#cr-stage').append('<form id="describeForm"><h1>Describe Game Idea</h1><p><textarea name="description"></textarea></p><p><input id="submitDescription" type="submit"></p></form></div>');
    /*        
	var table = '<h3>Tulokset</h3><table class="table"> <thead> <tr> <th>#</th> <th>Pisteet</th> <th>Joukkuebonus</th> <th>Kokonaispisteet</th> <th>Pelaajat</th> </tr> </thead> <tbody>';
	for (var i = 0; i < Game.hiScore.length; i++) {
		table += "<tr><td>" + (i + 1) + "</td><td>" + Game.hiScore[i].score + "</td><td>" + Game.hiScore[i].teamBonus + "</td><td>" + Game.hiScore[i].totalScore +"</td><td>" + Game.hiScore[i].name + "</td></tr>";
	}
	table += '</tbody> </table>';
	Crafty.e("2D, DOM, ScoreTable, Text")
		.attr({ x: 50, y: 42, z: 4, w: 700, h: 600 })
		.text(table);
	var ent = Crafty.e("2D, DOM, Image, QRCode")
		.attr({ x: 804, y: 548, z: 4 });
	var json = { "action": 'close', "roomId": Game.sockets.roomID };
	$.ajax({
		type: "GET",
		url: 'http://sportti.dreamschool.fi/galaxy/api/qrcode/JSON',
		data: json,
		cache: true,
		success: function(data) {
			var qr = $(data)[2];
			ent.image( $(qr).attr('src') );
			ent.addComponent('CLOSE');
			ent.addComponent("QRCode-CLOSE");
			Crafty.e("2D, DOM, Label, Text, QRCode-CLOSE")
				.attr({ x: 804, y: 672, z: 4, w: 150, h: 20 })
				.text("<strong>" + "Jatka" + "</strong>");
		}
	});
	*/

});

