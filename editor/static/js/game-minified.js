(function(e){"use strict";var t=window.location.pathname,n="http://"+window.location.hostname+"/editor",r=io.connect(n);r.on("connecting",function(){console.log("websocket connecting (game)")}),r.on("connect_failed",function(e){console.error("unable to connect to websocket (game)",e)}),r.on("connect",function(){console.log("websocket connected (game)")}),window.onmessage=function(e){if(e.origin!==window.location.origin)return;Parser.getGame(e.data,r)},Parser.getGame("super-magos",r),e(document).on("click tap",".volume-button",function(t){var n=e("body"),r=e(t.target);_.isUndefined(Crafty.magos.volume)||Crafty.magos.volume?(Crafty.magos.volume=!1,r.css("background-image","url(/static/img/components/icon-volume-off.png)")):(Crafty.magos.volume=!0,r.css("background-image","url(/static/img/components/icon-volume.png)"))}),e(document).on("click tap",".start-button",function(e){Crafty.scene("game")})})(jQuery);