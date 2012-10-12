if (typeof(crystalInfo) != "undefined") crystalInfo = {};

var crystalInfo = {

	stages : {
		'begin' : 'Shake to begin',
		'verbs-process' : 'Generating a verb...',
		'nouns' : 'Shake to generate a noun',
		'nouns-process' : 'Generating a noun...',
		'adjectives' : 'Shake to generate an adjective',
		'adjectives-process' : 'Generating an adjective...',
		'finale' : 'Write a short description for game idea.'
	},

	showStageInfo : function(stageKey) {
		$('#crystalInfo').html(this.stages[stageKey]).fadeIn(500);
	},

	restartCrystalBall : function() {
		$('#formBox').remove();
		initCrystalBall();
	},

	bindFormSend : function() {
		var that = this;
		var $form = $("#description-form");
	    $form.submit(function(e) {
	        $("#sendbutton").attr('disabled', true);
	        $("#sendwrapper").prepend('<span>Sending message, please wait... </span>');
	        $("#ajaxwrapper").load(
	            $form.attr('action') + ' #ajaxwrapper',
	            $form.serializeArray(),
	            function(responseText, responseStatus) {
	                $("#sendbutton").attr('disabled', false);
	                $('#restart').click(that.restartCrystalBall);
	            }
	        );
	        e.preventDefault(); 
	    });
	},

	showFinalForm : function(crystalWords) {
		var that = this;
		$.ajax({
            dataType : 'html',
            type : 'GET',
            url : '/crystal/description/',
            success : function(data, textStatus, jqXHR) {
                var formBox = $('<div id="formBox"></div>');
                $(formBox).html(data);
                $('body').append(formBox);
                $('#id_words').val(crystalWords);
                that.bindFormSend();                
            },
            error : function(jqXHR, textStatus, errorThrown) {
                $('#errors').html('Error in XHR request.<br/> ' + errorThrown).show();
            }
        });
	},

	init : function() {
		var that = this;
		$(this).bind("stage-change", function(event, stageKey) {
		    that.showStageInfo(stageKey);
		});
	}

}
