
$(document).ready(function() {
	/*$("#crystalBall").on('click', function(event) {
		var $tgt = $(event.target);	
		$tgt.toggleClass("active");
	});*/
	var words;
	var wordType = 0;
	var shakeCounter = 0;
	var shakeTreshold = 100;
	var shakeReverseDuration = 500;
	var shakeReverse = false;
	var shakeDecayInterval;
	var origTintRGB = convertToRGBArray('#FF00FF');
	var tintRGB = origTintRGB.slice(0);
	//http://stackoverflow.com/questions/9077325/testing-hardware-support-in-javascript-for-device-orientation-events-of-the-ipho
	var accelometer = window.DeviceOrientationEvent;
	accelometer = true;
	
	$.getJSON("words.json", function(data) {
		words = data;
		changeColor();
	});
	
	moveToCenter();
	setShaking();
	
	$("#crystalBallLens").mousedown(function() {
		shakeAction();

		$("#contentHolder").text("");
		
		$("#crystalBall").mousemove(function() {
			if(!shakeReverse) {
				changeColor("-1,2,0");
				shakeCounter++;
			}
			if(shakeCounter > shakeTreshold) {
				showWord();	
			}	
		});

		$("body").mouseup(function() {
			stopShaking();
		});
		
		/*$("#crystalBall").mouseleave(function() {
			stopShaking();
		});*/
	});

	function shakeAction() {
		if(shakeDecayInterval == null) {
			//$("#crystalBall").draggable("enable");
			setColorDecay(100, "1,-2,0");
			
			//Start word clearing effect (i.e. return color to original)
			if(shakeReverse) {
				var reverseSteps = shakeReverseDuration / 100;
				var reverseStepCounter = 0;
				var reverseInterval;
				var colorChange = "";
				
				for(var i=0; i<origTintRGB.length; i++) {
					var totalChange = origTintRGB[i] - tintRGB[i];
					var stepChange = (totalChange >= 0) ? Math.ceil(totalChange / reverseSteps) : Math.floor(totalChange / reverseSteps);
					
					colorChange += stepChange + ((i < origTintRGB.length) ? "," : "");
				}
				reverseInterval = setInterval(reverseStep, 100);
				shakeCounter = 0;
				
				//$("#crystalBall").animate({"left": "+=100px"}, "slow");
				
				function reverseStep() {
					if(reverseStepCounter < reverseSteps) {
						changeColor(colorChange);
						reverseStepCounter++;
					}
					else {
						shakeReverse = false;
						window.clearInterval(reverseInterval);
					}
				}
			}
		}
	}
	
	//Activates or deactivates shaking
	function setShaking(activate) {
		if(arguments.length == 0 || activate) {
			if(accelometer) {
				window.addEventListener("accelerationIncludingGravity", function(event) {
		            shakeAction();
		        }, true);
			}
			else {
				var diameter = $("#crystalBallLens").width();
				var boundaries = [0, 0, window.innerWidth-diameter, window.innerHeight-diameter];

				$("#crystalBall").draggable({handle: "#crystalBallLens", containment:boundaries});
			}
		}
		else {
			stopShaking();
			$("#crystalBall").draggable("destroy");
		}
	}
	
	//Mouse movement no longer counts as shaking
	function stopShaking() {
		$("#crystalBall").unbind('mousemove');
	}

	//Display a word in the crystall ball
	function showWord() {
		var wordTypes = ["verbs", "nouns", "adjectives"];
		var wordList = words[wordTypes[wordType]];
		var word = wordList[Math.floor(Math.random() * wordList.length)].word;
		
		$("#contentHolder").text(word);
		
		wordType = (wordType == wordTypes.length-1) ? 0 : wordType+1;
		setColorDecay(-1);
		shakeReverse = true;
		stopShaking();
		setShaking(false);//Stop dragging/shaking
		setShaking();
		moveToCenter(true);
	}

	//Starts color decay or cancels current decay if freq<0
	function setColorDecay(freq, decayRGB) {
		if(shakeDecayInterval != null) {
			window.clearInterval(shakeDecayInterval);
			shakeDecayInterval = null;
		}
		if(arguments.length == 2 || freq > 0) {
			shakeDecayInterval = setInterval(decay, freq);
		}
		
		function decay() {
			shakeCounter = Math.max(shakeCounter-1, 0);
			changeColor(decayRGB);
			//$("#contentHolder").text(shakeCounter);
		}
	}

	//Change the color of the crystall ball
	function changeColor(rgbChange) {
		var rgbChangeArray = (arguments[0] == null) ? [0,0,0] : rgbChange.split(",");
		var newColor = "rgb(";
		
		for(var i=0; i<rgbChangeArray.length; i++) {
			tintRGB[i] += parseInt(rgbChangeArray[i]);
			tintRGB[i] = Math.min(Math.max(0, tintRGB[i]), 255);
			newColor += tintRGB[i] + ((i < rgbChangeArray.length-1) ? "," : "");
		}
		newColor += ")";
		
		//var canvas = $("#crystalBallCanvas");
		var canvas = document.getElementById("crystalBallCanvas");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.beginPath();
		ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fillStyle = newColor;
		ctx.fill();
	}
	
	//Positions the crystall ball into the center of the window
	function moveToCenter(animate) {
		var $object = $("#crystalBall");
		var diameter = $("#crystalBallLens").width();
		var centerX = (window.innerWidth-diameter) / 2;
		var centerY = (window.innerHeight-diameter) / 2;

		if(arguments.length == 0 || !animate) {
			$object.css("left", centerX);
			$object.css("top", centerY);
		}
		else {
			var duration = Math.sqrt(Math.pow($object.position().left-centerX, 2) + Math.pow($object.position().top-centerY, 2)) * 2;
			duration = Math.max(duration, 500);

			$object.animate({left:centerX, top:centerY}, duration, "easeOutBounce")
		}
	}
});

//Return a string in format "rgb(R,G,B)"
function convertToRGB(hexString) {
	hexString = (hexString.charAt(0)=="#") ? hexString.substring(1,7) : hexString;
	
	var r = parseInt(hexString.substring(0,2), 16);
	var g = parseInt(hexString.substring(2,4), 16);
	var b = parseInt(hexString.substring(4,6), 16);
	
	return 'rgb('+r+','+g+','+b+')';
}

//Return an array of [R, G, B]
function convertToRGBArray(hexString) {
	var rgbArray = new Array();
	
	hexString = (hexString.charAt(0)=="#") ? hexString.substring(1,7) : hexString;
	rgbPart(hexString.substring(0,2));
	rgbPart(hexString.substring(2,4));
	rgbPart(hexString.substring(4,6));
	
	function rgbPart(part) {
		var value = parseInt(part, 16);
		rgbArray.push(value);
	}
	return rgbArray;
}
