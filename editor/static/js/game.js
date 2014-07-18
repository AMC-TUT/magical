// @codekit-prepend "/vendor/crafty-0.4.8.js"

var player;

(function($) {

// game slug
var slug = location.pathname.split("/").pop();

//var win = document.getElementById("preview").contentWindow;
window.postMessage(slug, window.location.protocol + "//" + window.location.host);

 // Parser.getGame('super-magos', socket);

  window.onmessage = function(e) {

    // socket.io
    var address = 'http://' + window.location.hostname;
    var socket = io.connect(address, {
      resource: 'editor/socket.io'
    });

    var sessionid = $.cookie('sessionid');
    var csrftoken = $.cookie('csrftoken');
    var paths = window.location.pathname.split('/');
    var slug = _.last(paths);

    var credentials = {
      sessionid: sessionid,
      csrftoken: csrftoken,
      slug: slug
    };

    socket.emit('setUserCredentials', credentials, function(data) {
      Parser.getGame(e.data, socket);
    });

    socket.on('connecting', function() {
      console.log('websocket connecting (game)');
    });

    socket.on('connect_failed', function(reason) {
      console.error('unable to connect to websocket (game)', reason);
    });

    socket.on('connect', function() {
      console.log('websocket connected (game)');
    });

    socket.on('error', function () {
      console.log('socket error (game)');
    });

    if (e.origin !== window.location.origin) {
      return;
    }

  };

  $(document).on('click tap', '.volume-button', function(event) {
    var $body = $('body'),
      $tgt = $(event.target);

    // toggle image
    if (_.isUndefined(Crafty.magos.volume) || Crafty.magos.volume) {
      Crafty.magos.audio.mute = true;
      $tgt.css('background-image', 'url(/static/img/icons/icon-volume-off.png)');
    } else {
      Crafty.magos.audio.mute = false;
      $tgt.css('background-image', 'url(/static/img/icons/icon-volume.png)');
    }

    // do something with sound
  });

})(jQuery);
