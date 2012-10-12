var words;
var wordType = 0;
var wordTypes = ["verbs", "nouns", "adjectives"];
var shakeCounter = 0;
var shakeReverse = false;
var shakeDecayInterval;
var motionListener;
var orientation;
var origTintRGB = convertToRGBArray('#FF00FF');
var tintRGB = origTintRGB.slice(0);
//http://stackoverflow.com/questions/9077325/testing-hardware-support-in-javascript-for-device-orientation-events-of-the-ipho
var accelometer = !(window.DeviceMotionEvent == undefined || window.DeviceMotionEvent.interval == undefined);
var gyroscope;
var x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;
var shakeInterval = null;
var crystalWords = '';
//accelometer = true;

//Activates or deactivates crystall ball dragging
function setDragging(activate) {
	if(arguments.length == 0 || activate) {
		$("#crystalBallLens").mousedown(function() {
			startDragging();
			$("#contentHolder").text("");
			$("#crystalBall").mousemove(function() {
				shakeListener();
			});

			$("body").mouseup(function() {
				stopDragging();
			});
			
			/*$("#crystalBall").mouseleave(function() {
				stopDragging();
			});*/
		});
	}
	else {
		stopDragging();
	}
}

//Shaking starts. Reverse effect is played first if effect is at the end
function startDragging() {
	var infoStageKey = wordTypes[wordType];
	$(crystalInfo).trigger('stage-change', infoStageKey + '-process');

	var diameter = $("#crystalBallLens").width();
	var boundaries = [0, 0, window.innerWidth-diameter, window.innerHeight-diameter];

	$("#crystalBall").draggable({handle: "#crystalBallLens", containment:boundaries});

	reverseEffect();
}

//Mouse movement no longer counts as shaking
function stopDragging() {
	$("#crystalBall").unbind("mousemove");
	$("#crystalBall").draggable("destroy");
}


//Shake action when DeviceOrientationEvent available
function orientationHandler(evt) {
	if(orientation == null) {
		reverseEffect();
	}
	console.log('evt.alpha: ' + evt.alpha);

	var accelTreshold = 100;
	var distance = Math.sqrt(evt.alpha * evt.alpha + evt.beta * evt.beta);

	orientation = new Object({x:evt.alpha, y:evt.beta});

	if(distance >= accelTreshold) {
		shakeListener();
	}
}

function motionHandler(e) {
	// set current x,y,z
	x1 = e.accelerationIncludingGravity.x;
	y1 = e.accelerationIncludingGravity.y;
	z1 = e.accelerationIncludingGravity.z;
}


//Shake action when DeviceOrientationEvent NOT available
function motionHandlerOLD(evt) {
	if(orientation == null) {
		reverseEffect();
	}
	var accelTreshold = 6;
	var distance;

	distance = Math.sqrt(evt.accelerationIncludingGravity.x * evt.accelerationIncludingGravity.x + evt.accelerationIncludingGravity.y * evt.accelerationIncludingGravity.y);
	orientation = new Object({x:evt.accelerationIncludingGravity.x, y:evt.accelerationIncludingGravity.y});

	/*if(evt.acceleration) {
		distance = Math.sqrt(evt.acceleration.x * evt.acceleration.x + evt.acceleration.y * evt.acceleration.y);
		orientation = new Object({x:evt.acceleration.x, y:evt.acceleration.y});
	}
	else {
		distance = Math.sqrt(evt.accelerationIncludingGravity.x * evt.accelerationIncludingGravity.x + evt.accelerationIncludingGravity.y * evt.accelerationIncludingGravity.y);
		orientation = new Object({x:evt.accelerationIncludingGravity.x, y:evt.accelerationIncludingGravity.y});
	}*/
	if(distance >= accelTreshold) {
		shakeListener();
	}
}

//Action whenever shaking or dragging is on
function shakeListener() {
	var shakeTreshold = 100;
	//$("#contentHolder").text(shakeCounter);
	if(!shakeReverse) {
		changeColor("-1,2,0");
		shakeCounter++;
		if(accelometer) {
			// let's accelerate shaking a bit
			shakeCounter += 6;
			// animate shake
			var deviateX = (x2 < 0) ? -30: 30;
			var diameter = $("#crystalBallLens").width();
			var centerX = (window.innerWidth-diameter) / 2;
			var centerY = (window.innerHeight-diameter) / 2;
			$('#crystalBall').animate({left:centerX + deviateX, top:centerY}, 200, "easeOutElastic");
		}
	}
	//Show a word
	if(shakeCounter > shakeTreshold) {
		shakeCounter = 0;
		if (shakeInterval) {
			clearInterval(shakeInterval);
        	shakeInterval = null;
        }
		showWord();
	}
}

//Activates or deactivates crystall ball shaking
function enableMotionDetection() {
	orientation = null;	
	//motionListener = window.addEventListener("devicemotion", motionHandler, true);
	/*
	if (window.DeviceOrientationEvent) {
		motionListener = window.addEventListener("deviceorientation", orientationHandler, false);
	} else {
		motionListener = window.addEventListener("devicemotion", motionHandler, true);
	}
	*/

	if (typeof window.DeviceMotionEvent != 'undefined') {
		// reset position
		x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;
		shakeReverse = false;
		// Shake sensitivity
		var sensitivity = 4;
		// Listen to motion events and update the position 
		motionListener = window.addEventListener('devicemotion', motionHandler, false);

		// Periodically check the position and fire
		// if the change is greater than the sensitivity 
		shakeInterval = setInterval(function () {
			var change = Math.abs(x1 - x2 + y1 - y2 + z1 - z2);

			if (change > sensitivity) {
				//alert('Shake!');
				//shakeBall(toX, toY);
				shakeListener();
			}

			// Update new position
			x2 = x1;
			y2 = y1;
			z2 = z1;
		}, 150);
	}



}


//Activates or deactivates shaking
function setShaking(activate) {
	if(arguments.length == 0 || activate) {
        enableMotionDetection();
	} else {
		if (window.DeviceOrientationEvent) {
			window.removeEventListener("deviceorientation", orientationHandler);
			}
		else {
			window.removeEventListener("devicemotion", motionHandler);
		}
		
		motionListener = null;
	}
}

function reverseEffect() {
	if(shakeDecayInterval == null) {
		$("#contentHolder").text("");
		setColorDecay(100, "1,-2,0");
		
		//Start word clearing effect (i.e. return color to original)
		if(shakeReverse) {
			var reverseSteps = 5;
			var reverseStepCounter = 0;
			var reverseInterval;
			var colorChange = "";
			
			for(var i=0; i<origTintRGB.length; i++) {
				var totalChange = origTintRGB[i] - tintRGB[i];
				var stepChange = (totalChange >= 0) ? Math.ceil(totalChange / reverseSteps) : Math.floor(totalChange / reverseSteps);
				
				colorChange += stepChange + ((i < origTintRGB.length) ? "," : "");
			}
			
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
			reverseInterval = setInterval(reverseStep, 100);
		}
	}
}	



//Display a word in the crystall ball
function showWord() {
	var wordList = words[wordTypes[wordType]];
	var word = wordList[Math.floor(Math.random() * wordList.length)].word;
	// save word for later use
	crystalWords += wordTypes[wordType] + '=' + word + ', ';

	$("#contentHolder").text(word);

	wordType = (wordType == wordTypes.length-1) ? 0 : wordType+1;
	setColorDecay(-1);
	shakeReverse = true;

	var infoStageKey = wordTypes[wordType];
	if (wordType !== 0) {
		$(crystalInfo).trigger('stage-change', infoStageKey);

		if(accelometer) {
			setTimeout(enableMotionDetection, 4000);
		} else {
			stopDragging();
		}
	} else {
		// last stage
		$(crystalInfo).trigger('stage-change', 'finale');
		crystalInfo.showFinalForm(crystalWords);
	}
	moveToCenter(true);
}

//Color starts to revert back to original or cancels current decay if freq<0
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

	if (arguments.length == 0 || !animate) {
		$object.css("left", centerX+"px");
		$object.css("top", centerY+"px");
	} else {
		var duration = Math.sqrt(Math.pow($object.position().left-centerX, 2) + Math.pow($object.position().top-centerY, 2)) * 2;
		duration = Math.max(duration, 1000);

		$object.animate({left:centerX, top:centerY}, duration, "easeOutElastic");
	}
	stopDragging();
}

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

function debugText(text) {
	$("#debug").html($("#debug").text()+"<br>"+text);
}

function initCrystalBall() {
	accelometer = !(window.DeviceMotionEvent == undefined || window.DeviceMotionEvent.interval == undefined);
	accelometer = window.DeviceMotionEvent;
	crystalWords = '';
	$("#contentHolder").text('');
	/*if (window.DeviceOrientationEvent) {
	    window.addEventListener("deviceorientation", handleOrientation, false);
	}

	function handleOrientation(event) {
		//console.log("Orientation:" + event.alpha + ", " + event.beta + ", " + event.gamma);
		accelometer = event; // will be either null or with event data
	}

	if (window.DeviceMotionEvent && !accelometer) {
		window.addEventListener('devicemotion', handleMotion, false);
	}*/

	$.getJSON("/crystal/ajax_list_words/foobar", function(data) {
		words = data;
		changeColor();
	});
	//$("#debug").html("accelometer: "+accelometer+"<br> DeviceMotionEvent: "+window.DeviceMotionEvent+"<br> DeviceOrientationEvent: "+window.DeviceOrientationEvent);
	moveToCenter();
	
	crystalInfo.init();
	$(crystalInfo).trigger('stage-change', 'begin');

	if(accelometer) {
		setShaking();
	}
	else {
		setDragging();
	}
}

$(document).ready(function() {
	initCrystalBall();
});
