var gameinfo = {
	"level1":{
		title: "Game is not named.", 
		instructions:"No instructions are given.", 
		platformType: "air",
		playerImg: "magos-girl",
		itemInterval:4000,
		hazardInterval:4000,
		wordInterval: 4000,
		sky: null, 
		scroll:[ 
			{item:null, speed:5}, 
			{item:null, speed:10},
			{item:null, speed:15}
		],
		collectables:[], 
		hazards:[], 
		powerups:[],
		wordRules:[],
		answers:[],
		fractionRules:[],
		matchRule:null,
		gameMode: "time", 
		gameDuration: 60,
		goalDistance: 400,
		survivalFactor: 0.95,
		extraLife: false,
		turboSpeed: false,
		bgcolor: "#F2F2F2",
		star3limit: 0,
		star2limit: 0,
		star1limit: 0,
		memoryIncrease: 0,
		memoryStart: 0,
		matchPointsRight: 0,
		matchPointsWrong: 0,
		hazardEffect: 0,
		sliceAmount: 0,
		pieceAmount: 0,
		pizzaRules:[],
		jumpPower: -24,
		sensitivity: {
			jump: 18000,
			motion: 10000
		},
		bonustimelimit: 220
	}
}
