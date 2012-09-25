(function($) {

  "use strict";

  // socket.io
  var pathname = window.location.pathname;
  var address = 'http://' + window.location.hostname + '/editor';
  var socket = io.connect(address);

  socket.on('connecting', function() {
    console.log('websocket connecting (game)');
  });

  socket.on('connect_failed', function(reason) {
    console.error('unable to connect to websocket (game)', reason);
  });

  socket.on('connect', function() {
    console.log('websocket connected (game)');
  });

  window.onmessage = function(e) {
    if (e.origin !== window.location.origin) {
      return;
    }

    Parser.getGame(e.data, socket);
  };

  Parser.getGame('super-magos', socket);

  // TODO Refactor Crafty.Mouse.Click
  $(document).on('click tap', '.volume-button', function(event) {
    var $body = $('body'),
      $tgt = $(event.target);

    // toggle image
    if (_.isUndefined(Crafty.magos.volume) || Crafty.magos.volume) {
      Crafty.magos.volume = false;
      $tgt.css('background-image', 'url(/static/img/icons/icon-volume-off.png)');
    } else {
      Crafty.magos.volume = true;
      $tgt.css('background-image', 'url(/static/img/icons/icon-volume.png)');
    }

    // do something with sound
  });

  // TODO Refactor Crafty.Mouse.Click
  $(document).on('click tap', '.start-button', function(event) {
    // open game scene
    Crafty.scene('game');
  });

})(jQuery);
