var words;
var wordType = 0;
var shakeCounter = 0;
var shakeReverse = false;
var shakeDecayInterval;
var motionListener;
var orientation;
var origTintRGB = convertToRGBArray('#FF00FF');
var tintRGB = origTintRGB.slice(0);
var accelometer;
var motionOn;

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

//Activates or deactivates shaking
function setShaking(activate) {
	if(arguments.length == 0 || activate) {
        enableMotionDetection();
	}
	else {
		window.removeEventListener("devicemotion", motionHandler);
		motionListener = null;
	}
}

//Activates or deactivates crystall ball shaking
function enableMotionDetection() {
	debugText("enableMotionDetection");
	orientation = null;
	motionOn = false;

	motionListener = window.addEventListener("devicemotion", motionHandler, false);
}

//Shake action when DeviceOrientationEvent available
//Not used since deviceMotion suits this task better
/*if (window.DevicedebugEvent) {
	motionListener = window.addEventListener("deviceorientation", debugTextHandler, false);
}*/
/*function orientationHandler(evt) {
	if(orientation == null) {
		reverseEffect();
	}
	var accelTreshold = 6;
	var distance = Math.sqrt(evt.alpha * evt.alpha + evt.beta * evt.beta);

	orientation = new Object({x:evt.alpha, y:evt.beta});

	if(distance >= accelTreshold) {
		shakeListener();
	}
}*/

//Shake motion detection action
function motionHandler(evt) {
	//debugText("motionHandler: "+orientation);
	//if(orientation === null) {
	if(!motionOn) {
		reverseEffect();
	}
	var accelTreshold = 6;
	var distance;
	var accel = evt.accelerationIncludingGravity;

	distance = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
	orientation = new Object({x:accel.x, y:accel.y});
	motionOn = true;
	//debugText("("+orientation.x+","+orientation.y+")");
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

function reverseEffect() {
	debugText("reverseEffect: "+shakeDecayInterval)
	if(shakeDecayInterval == null) {
		$("#contentHolder").text("");

		setColorDecay(100, "1,-4,0");

		//Start word clearing effect (i.e. return color to original)
		debugText("shakeReverse: "+shakeReverse);
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

//Action whenever shaking or dragging is on
function shakeListener() {
	var shakeTreshold = 30;
	//$("#contentHolder").text(shakeCounter);

	if(!shakeReverse) {
		changeColor("-1,4,0");
		shakeCounter++;
	}
	//Show a word
	if(shakeCounter > shakeTreshold) {
		showWord();
		shakeCounter = 0;
	}
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

	if(accelometer) {
		setTimeout(enableMotionDetection, 2000);
	}
	else {
		stopDragging();
		//setDragging(false);//cancel dragging
		//setDragging();
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

	if(arguments.length == 0 || !animate) {
		$object.css("left", centerX+"px");
		$object.css("top", centerY+"px");
	}
	else {
		var duration = Math.sqrt(Math.pow($object.position().left-centerX, 2) + Math.pow($object.position().top-centerY, 2)) * 2;
		duration = Math.max(duration, 1000);

		$object.animate({left:centerX, top:centerY}, duration, "easeOutElastic")
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
	// $("#debug").html($("#debug").text()+" <br>"+text);
}

$(document).ready(function() {
	//http://stackoverflow.com/questions/9077325/testing-hardware-support-in-javascript-for-device-orientation-events-of-the-ipho
	//accelometer = !(window.DeviceMotionEvent == undefined || window.DeviceMotionEvent.interval == undefined);
	accelometer = window.DeviceMotionEvent;

	$.getJSON("words.json", function(data) {
		words = data;
		changeColor();
	});
	//$("#debug").html("accelometer: "+accelometer+"<br> DeviceMotionEvent: "+window.DeviceMotionEvent+"<br> DeviceOrientationEvent: "+window.DeviceOrientationEvent);
	moveToCenter();

	if(accelometer) {
		setShaking();
	}
	else {
		setDragging();
	}
});
