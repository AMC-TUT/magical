var textures =  {
	"aeroplane": "/editor-lite/static/img/aeroplane.png",
	"zeppelin": "/editor-lite/static/img/zeppelin.png",
	"bird": "/editor-lite/static/img/bird.png",
	"rocket": "/editor-lite/static/img/rocket.png",
	"satellite": "/editor-lite/static/img/satellite.png",
	"pollution": "/editor-lite/static/img/pollution.png",
	"itemhelp": "/editor-lite/static/img/editor-items.png",
	"playerhelp": "/editor-lite/static/img/playerhelp.png",
	"sign": "/editor-lite/static/img/sign.png",
	"scroll1": "/editor-lite/static/img/scroll1.png",
	"scroll2": "/editor-lite/static/img/scroll2.png",
	"scroll3": "/editor-lite/static/img/scroll3.png",
	"mountains-brown": "/editor-lite/static/img/parallax/mountains-brown.png",
	"mountains-big": "/editor-lite/static/img/parallax/mountains-big.png",
	"mountains-violet": "/editor-lite/static/img/parallax/mountains-violet.png",
	"mountains-snow": "/editor-lite/static/img/parallax/mountains-snow.png",
	"fence": "/editor-lite/static/img/parallax/fence.png",
	"palms": "/editor-lite/static/img/parallax/palms.png",
	"grass-yellow": "/editor-lite/static/img/parallax/grass-yellow.png",
	"grass-green": "/editor-lite/static/img/parallax/grass-green.png",
	"houses1": "/editor-lite/static/img/parallax/houses1.png",
	"houses2": "/editor-lite/static/img/parallax/houses2.png",
	"houses3": "/editor-lite/static/img/parallax/houses3.png",
	"desert": "/editor-lite/static/img/parallax/desert2.png",
	"city-dark": "/editor-lite/static/img/parallax/city-dark.png",
	"sky-blue": "/editor-lite/static/img/parallax/sky-blue.png",
	"sky-grey": "/editor-lite/static/img/parallax/sky-grey.png",
	"flappy": "/editor-lite/static/img/parallax/flappy-bg.png",
	"space": "/editor-lite/static/img/space.png",
	"asteroid": "/editor-lite/static/img/asteroid.png",
	"sky": "/editor-lite/static/img/sky.png",
	"forest": "/editor-lite/static/img/parallax/forest.png",
	"sea": "/editor-lite/static/img/parallax/sea.png",
	"factory": "/editor-lite/static/img/parallax/factory.png",
	"scorebg": "/editor-lite/static/img/scorebg.png",
	"star": "/editor-lite/static/img/star-big.png",
	"star-dark": "/editor-lite/static/img/star-big-dark.png",
	"newhighscore": "/editor-lite/static/img/newhighscore.png",
	"heart": "/editor-lite/static/img/heart.png",
	"menubtn": "/editor-lite/static/img/menubtn.png",
	"editorbtn": "/editor-lite/static/img/editorBtn.png",
	"witch": "/editor-lite/static/img/witch.png",
	"dragon": "/editor-lite/static/img/dragon.png",
	"coin": "/editor-lite/static/img/coin-magos.png",
	"hat": "/editor-lite/static/img/hat.png",
	"earth": "/editor-lite/static/img/earth.png",
	"saturnus": "/editor-lite/static/img/saturnus.png",
	"speedmeter": "/editor-lite/static/img/speedmeter.png",
	"cloud": "/editor-lite/static/img/cloud.png",
	"storm-cloud": "/editor-lite/static/img/cloud-storm.png",
	"magos-girl": "/editor-lite/static/img/magos-girl.png",
	"gift": "/editor-lite/static/img/gift.png",
	"sky-small-clouds": "/editor-lite/static/img/sky-small-clouds.png",
	"santa": "/editor-lite/static/img/santa.png",
	"explosive": "/editor-lite/static/img/explosive.png",
	"acid": "/editor-lite/static/img/acid.png",
	"toxic": "/editor-lite/static/img/toxic.png",
	"radioactive": "/editor-lite/static/img/radioactive.png",
	"flammable": "/editor-lite/static/img/flammable.png",
	"magos-logo": "/editor-lite/static/img/magos-lite-logo.png",
	"p_1_6": "/editor-lite/static/img/pizza/p_1_6.png",
	"p_2_6": "/editor-lite/static/img/pizza/p_2_6.png",
	"p_3_6": "/editor-lite/static/img/pizza/p_3_6.png",
	"p_4_6": "/editor-lite/static/img/pizza/p_4_6.png",
	"p_5_6": "/editor-lite/static/img/pizza/p_5_6.png",
	"p_6_6": "/editor-lite/static/img/pizza/p_6_6.png",
	"car": "/editor-lite/static/img/car.png",
	"monster-truck": "/editor-lite/static/img/monster-truck.png",
	"ground": "/editor-lite/static/img/ground.png",
	"exit": "/editor-lite/static/img/exit.png",
	"playBtn": "/editor-lite/static/img/play.png",
	"parachute": "/editor-lite/static/img/parachute.png"
};

var sounds = {
	"sound_right": {"url": "/editor-lite/static/sounds/jippii.mp3"},
	"sound_dead": {"url": "/editor-lite/static/sounds/dead.mp3"}
};

var gameSounds = {
	"jippii": { id: "jippii", src:"/editor-lite/static/audio/sounds/jippii.mp3"},
    "coin-sound": { id: "coin-sound", src:"/editor-lite/static/audio/sounds/coin-sound.mp3"},
    "dead": { id: "dead", src:"/editor-lite/static/audio/sounds/coin-sound.mp3"},
    "right": { id: "right", src:"/editor-lite/static/audio/sounds/coin-sound.mp3"},
    "wrong": { id: "wrong", src:"/editor-lite/static/audio/sounds/wrong.mp3"}
};

var textureMenu =  {
	groundPlayers:[
		{text:"monster truck", value:"monster-truck"},
		{text:"car", value:"car"}
	],
	airPlayers:[
		{text:"magos-girl", value:"magos-girl"},
		{text:"witch", value:"witch"},
		{text:"santa claus", value:"santa"},
		{text:"rocket", value:"rocket"},
		{text:"aeroplane", value:"aeroplane"}
	],
	grounds:[
		{text:"", value:""},
		{text:"palms", value:"palms"},
		{text:"houses far", value:"houses3"},
		{text:"fence", value:"fence"},
		{text:"flappy", value:"flappy"}
	],
	airGrounds:[
		{text:"", value:""},
		{text:"palms", value:"palms"},
		{text:"fence", value:"fence"},
		{text:"desert", value:"desert"},
		{text:"yellow grass", value:"grass-yellow"},
		{text:"green grass", value:"grass-green"},
		{text:"houses near", value:"houses1"},
		{text:"houses far", value:"houses3"},
		{text:"sea", value:"sea"},
		{text:"forest", value:"forest"},
		{text:"flappy", value:"flappy"}
	],
};