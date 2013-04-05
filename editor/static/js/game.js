// @codekit-prepend "/vendor/crafty-0.4.8.js"

(function($) {

 // "use strict";

 // Parser.getGame('super-magos', socket);

  window.onmessage = function(e) {

    // socket.io
    var address = 'http://' + window.location.hostname;
    //var socket = io.connect(address);
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
    console.log('credentials:');
    console.log(credentials);
    
    socket.emit('setUserCredentials', credentials, function(data) {
      console.log('DATA ---->');
      console.log(data);
      //callback(data);
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

  $(document).on('click tap', '.start-button', function(event) {
    // open game scene
    Crafty.scene('game');
  });

})(jQuery);
