function setDragging(e){arguments.length==0||e?$("#crystalBallLens").mousedown(function(){startDragging(),$("#contentHolder").text(""),$("#crystalBall").mousemove(function(){shakeListener()}),$("body").mouseup(function(){stopDragging()})}):stopDragging()}function startDragging(){var e=$("#crystalBallLens").width(),t=[0,0,window.innerWidth-e,window.innerHeight-e];$("#crystalBall").draggable({handle:"#crystalBallLens",containment:t}),reverseEffect()}function stopDragging(){$("#crystalBall").unbind("mousemove"),$("#crystalBall").draggable("destroy")}function setShaking(e){arguments.length==0||e?enableMotionDetection():(window.removeEventListener("devicemotion",motionHandler),motionListener=null)}function enableMotionDetection(){debugText("enableMotionDetection"),orientation=null,motionListener=window.addEventListener("devicemotion",motionHandler,!1)}function motionHandler(e){orientation===null&&reverseEffect();var t=6,n;n=Math.sqrt(e.accelerationIncludingGravity.x*e.accelerationIncludingGravity.x+e.accelerationIncludingGravity.y*e.accelerationIncludingGravity.y),orientation=new Object({x:e.accelerationIncludingGravity.x,y:e.accelerationIncludingGravity.y}),n>=t&&shakeListener()}function reverseEffect(){debugText("reverseEffect: "+shakeDecayInterval);if(shakeDecayInterval==null){$("#contentHolder").text(""),setColorDecay(100,"1,-4,0"),debugText("shakeReverse: "+shakeReverse);if(shakeReverse){var e=5,t=0,n,r="";for(var i=0;i<origTintRGB.length;i++){var s=origTintRGB[i]-tintRGB[i],o=s>=0?Math.ceil(s/e):Math.floor(s/e);r+=o+(i<origTintRGB.length?",":"")}function u(){t<e?(changeColor(r),t++):(shakeReverse=!1,window.clearInterval(n))}n=setInterval(u,100)}}}function shakeListener(){var e=30;shakeReverse||(changeColor("-1,4,0"),shakeCounter++),shakeCounter>e&&(showWord(),shakeCounter=0)}function showWord(){var e=["verbs","nouns","adjectives"],t=words[e[wordType]],n=t[Math.floor(Math.random()*t.length)].word;$("#contentHolder").text(n),wordType=wordType==e.length-1?0:wordType+1,setColorDecay(-1),shakeReverse=!0,accelometer?setTimeout(enableMotionDetection,2e3):stopDragging(),moveToCenter(!0)}function setColorDecay(e,t){function n(){shakeCounter=Math.max(shakeCounter-1,0),changeColor(t)}shakeDecayInterval!=null&&(window.clearInterval(shakeDecayInterval),shakeDecayInterval=null);if(arguments.length==2||e>0)shakeDecayInterval=setInterval(n,e)}function changeColor(e){var t=arguments[0]==null?[0,0,0]:e.split(","),n="rgb(";for(var r=0;r<t.length;r++)tintRGB[r]+=parseInt(t[r]),tintRGB[r]=Math.min(Math.max(0,tintRGB[r]),255),n+=tintRGB[r]+(r<t.length-1?",":"");n+=")";var i=document.getElementById("crystalBallCanvas"),s=i.getContext("2d");s.clearRect(0,0,i.width,i.height),s.beginPath(),s.arc(i.width/2,i.height/2,i.width/2,0,Math.PI*2,!0),s.closePath(),s.fillStyle=n,s.fill()}function moveToCenter(e){var t=$("#crystalBall"),n=$("#crystalBallLens").width(),r=(window.innerWidth-n)/2,i=(window.innerHeight-n)/2;if(arguments.length==0||!e)t.css("left",r+"px"),t.css("top",i+"px");else{var s=Math.sqrt(Math.pow(t.position().left-r,2)+Math.pow(t.position().top-i,2))*2;s=Math.max(s,1e3),t.animate({left:r,top:i},s,"easeOutElastic")}stopDragging()}function convertToRGB(e){e=e.charAt(0)=="#"?e.substring(1,7):e;var t=parseInt(e.substring(0,2),16),n=parseInt(e.substring(2,4),16),r=parseInt(e.substring(4,6),16);return"rgb("+t+","+n+","+r+")"}function convertToRGBArray(e){function n(e){var n=parseInt(e,16);t.push(n)}var t=new Array;return e=e.charAt(0)=="#"?e.substring(1,7):e,n(e.substring(0,2)),n(e.substring(2,4)),n(e.substring(4,6)),t}function debugText(e){$("#debug").html($("#debug").text()+" <br>"+e)}var words,wordType=0,shakeCounter=0,shakeReverse=!1,shakeDecayInterval,motionListener,orientation,origTintRGB=convertToRGBArray("#FF00FF"),tintRGB=origTintRGB.slice(0),accelometer;$(document).ready(function(){accelometer=window.DeviceMotionEvent,$.getJSON("words.json",function(e){words=e,changeColor()}),moveToCenter(),accelometer?setShaking():setDragging()});