(function($) {

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
      $tgt.css('background-image', 'url(/static/img/components/volume-off.png)');
    } else {
      Crafty.magos.volume = true;
      $tgt.css('background-image', 'url(/static/img/components/volume.png)');
    }

    // do something with sound
  });

  // TODO Refactor Crafty.Mouse.Click
  $(document).on('click tap', '.start-button', function(event) {
    // open game scene
    Crafty.scene('game');
  });

  $(document).on('getHighscores', function(event) {
    var el = '<h2>TOP5</h2>';
    el += '<ol>';
    el += '<li>Lorem Ipsum</li>';
    el += '<li>Consectetur Adipisicing</li>';
    el += '<li>Deserunt Mollit</li>';
    el += '<li>Excepteur Sint Occaecat</li>';
    el += '<li>Ullamco Laboris</li>';
    el += '</ol>';

    $('#cr-stage').find('.highscore').append(el);

  });

})(jQuery);
