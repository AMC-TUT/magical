/* Author:

*/
function getWords() {
	$.getJSON("/crystal/ajax_list_words/italy_list", function(data) {
		Game.words = data;
		//console.log(Game.words);
	});
}

window.onload = function() {
	//Crafty.mobile = false;
	getWords(); // we should wait for this to end...
	// Fullscreen up to Game.width (1024px)
	if (window.innerWidth < Game.width) {
	    Crafty.init(Crafty.DOM.window.width,Crafty.DOM.window.height);
	    Game.width = Crafty.DOM.window.width;
	    Game.height = Crafty.DOM.window.height;
	} else {
	    Crafty.init(Game.width,Game.height);
	}
    $('.container').width(Game.width);
	Crafty.canvas.init();
	Crafty.scene("Loading");

};

var Game = {
	width: 1024,
	height: 748,

	stage: 0,
	stages: [
		{ num : 0, desc: 'Drag ball to begin', badge: false },
		{ num : 1, name : '1. Verb', wordType: 'verbs', _x: 20, _y: 10, desc: 'Define a game action.', entity: null, badge: true },
		{ num : 2, desc: 'Define a game action. Drag ball to continue', badge: false },
		{ num : 3, name : '2. Noun', wordType: 'nouns', _x: 180, _y: 10, desc: 'Add targets to game action.', entity: null, badge: true },
		{ num : 4, desc: 'Add targets to game action. Drag ball to continue', badge: false },
		{ num : 5, name : '3. Adjective', wordType: 'adjectives', _x: 340, _y: 10, desc: 'Finnish the idea.', entity: null, badge: true },
		{ num : 6, desc: 'Finnish the idea. Drag ball to continue', badge: false },
		{ num : 7, name : '4. Describe', _x: 500, _y: 10, desc: 'Document the idea', entity: null, badge: true },
	],

	words: null,
	usedWords: {},
	wordsHistory: []

};
