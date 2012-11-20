
function bindFormSend() {
	$('#description-form').bind('submit', function(e) {
        $("#sendbutton").attr('disabled', true);
		e.preventDefault();
		var myForm = e.target;
		/*console.log(myForm);
		console.log($(myForm).serialize());
		*/
		var desc = $(myForm).find('textarea')[0].value;
        $("#ajaxwrapper").load(
            $(myForm).attr('action') + ' #ajaxwrapper',
            $(myForm).serializeArray(),
            function(responseText, responseStatus) {
                $("#sendbutton").attr('disabled', false);                
				$(myForm).remove();
				//$('#cr-stage > div').remove(); // remove orphan DOM elements div
				if(Game.usedWords) {
					Game.wordsHistory.push({ 'words': Game.usedWords, 'desc': desc});
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
        	Crafty.selected = false;
        	$('#id_description').focus();
        },
        error : function(jqXHR, textStatus, errorThrown) {
            $('#errors').html('Error in XHR request.<br/> ' + errorThrown).show();
        }
    });
}

// Loading scene
Crafty.scene("Loading", function () {
	Crafty.e("HTML")
			.append('<br/><br/>'
			+ ' <div class="hero-unit span8 offset1">'
			+ ' <div class="row">'
			+ ' <img src="/static/img/magos-m-black.png" class="span6 offset1" alt="" />'
			+ ' </div>'
			+ ' <div class="row">'
			+ ' <div class="progress progress-warning active">'
			+ ' <div class="bar">'
			+ ' </div>'
			+ ' </div>'
			+ ' </div>'
			+ ' </div>');

	// assets to preload and a callback when complete (don't put sprites here!)
    Crafty.load(
    	[
    		"/static/img/turq-bg.jpg",
    		"/static/img/green-bg.jpg"
    	], 
    	function () {
    		Crafty.scene("Game"); //when assets has been loaded
    	},
		function(e) {
			//progress
			$(".progress .bar").css("width", Math.round(e.percent) + "%");
		},
		function(e) {
			//error
			alert('Error loading ' + e.src + ' while loading game assets (loaded ' + e.loaded + ' of ' + e.total + ')');
		}    	
    );

    //black background with some loading text
    Crafty.background("#000");
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 })
            .text("Loading")
            .css({ "text-align": "center" });
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
		var wordTripletY = 215;
		_.each(Game.wordsHistory.reverse(), function(wordsObj) {
			var wordsTriplet = Crafty.e("WordTriplet")
				.text(wordsObj.words.verbs + ", " + wordsObj.words.nouns + ", " + wordsObj.words.adjectives)
				.attr({x: 10, y: wordTripletY, w: 220 , h: 40});
			wordsTriplet.orig_x = 10;
			wordsTriplet.orig_y = wordTripletY;
			wordsTriplet.words = wordsObj.words.verbs + ", " + wordsObj.words.nouns + ", " + wordsObj.words.adjectives;
			wordsTriplet.desc = wordsObj.desc;
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

