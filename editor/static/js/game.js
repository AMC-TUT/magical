
(function($) {

  // socket.io
  var pathname = window.location.pathname;
  var address = 'http://'+window.location.hostname+'/editor';
  var socket = io.connect(address);

  socket.on('connecting', function() {
    console.log('websocket connecting (game)');
  });

  socket.on('connect_failed', function (reason) {
    console.error('unable to connect to websocket (game)', reason);
  });

  socket.on('connect', function () {
    console.log('websocket connected (game)');
  });

  window.onmessage = function(e){
    if(e.origin !== window.location.origin) { return; }

    Parser.getGame(e.data, socket);
  };

})(jQuery);
