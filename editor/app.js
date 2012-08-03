
var express = require('express'),
  params = require('express-params'),
  //http = require('http'),
  request = require('request'),
  querystring = require('querystring'),
  fs = require('fs'),
  //app = express.createServer(),
  _ = require('underscore')._;
  //io = require('socket.io').listen(app);


var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server);

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
//io.set('log level', 0); // reduce logging

params.extend(app);

app.use('/static', express.static(__dirname + '/static'));

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

// Routes

app.param('slug', /[a-zA-Z0-9-]+$/);

app.get('/game/:slug', function(req, res) {
  res.sendfile(__dirname + '/game/index.html');
});

app.get('/:slug', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(4000);

var questions = [],
  qid = 0,
  rooms = [];

var editor = io.of('/editor').authorization(function (handshakeData, callback) {
    console.dir(handshakeData);
    handshakeData.foo = 'baz';
    callback(null, true);
  }).on('connection', function (socket) {

  socket.on('connect', function() {
    console.log('client connected, client id: ' + socket.id);
  });

  socket.on('connect_failed', function (reason) {
    console.error('unable to connect to namespace', reason);
  });

  socket.on('connect', function () {
    console.info('sucessfully established a connection with the namespace');
  });

  socket.on('chat-message', function (message, fn) {

    if(_.isString(message)) {

      var credentials = {};
      socket.get('credentials', function (err, _credentials) {
        credentials = _credentials;
      });

      message = { 'name': credentials.firstName, 'magos': credentials.magos, 'message': message };

      socket.broadcast.in(credentials.slug).emit('chat-message', message);

      fn(message);

    }

  });

  socket.on('get-game', function(slug, fn) {

    slug = _.isString(slug) ? slug : '';

    var room = _.find(rooms, function(room) { return room.slug === slug; });

    //
    if(_.isUndefined(room)) {

      // make request
      request.get('http://sportti.dreamschool.fi/genova/fakeGame.json?' + slug, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          //
          var room = JSON.parse(body);
          //
          rooms.push(room);
          //
          fn(room);
        }
      });

    } else {
      // return found game object
      fn(room);
    }

  });

  socket.on('getLanguages', function(noob, fn) {
    // make request
    request.get('http://sportti.dreamschool.fi/genova/fakeLanguages.json', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        //
        fn(JSON.parse(body));
      } else if(error) {
        console.log("ERROR while getting languages");
        //
        fn([]);
      }
    });
  });

  socket.on('set-user-credentials', function (credentials, fn) {

    socket.set('credentials', credentials, function () { });

    var userName = "";
    socket.get('credentials', function (err, credentials) {
      userName = credentials.userName;
    });

    console.log(credentials);

    fn('user´s credentials saved');

  });

  socket.on('join-room', function (slug, fn) {

    var credentials = {};
    socket.get('credentials', function (err, _credentials) {
      credentials = _credentials;
    });

    var room = _.find(rooms, function(obj) { return obj.slug === slug; });

    if(!_.isObject(room)) {

      var json = fs.readFileSync('static/game.json', 'utf8');

      room = JSON.parse(json);

      console.log(room.title);

      rooms.push(room);
      // create room if it not exists

      // and fetch game information from db
    }

    if(credentials.role === "student") {
      //
      var author = _.find(room.authors, function(obj) { return obj.userName === credentials.userName; });

      if(_.isObject(author)) {

        // roles that are not in use right now
        var magoses = _.filter(room.users, function(obj) { return _.isUndefined(obj.userName); });

        // try first join as own role and if that is reserved join first one which is free
        var user = _.find(magoses, function(obj) { return obj.magos === author.magos; });

        if(!_.isUndefined(user)) {
          //
          user = _.find(room.users, function(obj) { return obj.magos === author.magos; });
          user.userName = credentials.userName;
          user.role = credentials.role; //'student';
          user.id = socket.id;

          credentials['magos'] = user.magos;
          credentials['room'] = slug;
          credentials['slug'] = slug;
          socket.set('credentials', credentials, function () { });

          socket.join(slug);

          // emit message to other users
          io.sockets.in(slug).emit('new user logged in', user);

          fn('successfully joined to room \n - room: ' + slug + ' \n - magos: ' + user.magos);

        } else {

          var freeone = _.find(magoses, function(obj) { return _.isUndefined(obj.userName); });

          user = _.find(room.users, function(obj) { return obj.magos === freeone.magos; });
          user.userName = credentials.userName;
          user.role = credentials.role; //'student';
          user.id = socket.id;

          credentials['magos'] = user.magos;
          credentials['room'] = slug;
          socket.set('credentials', credentials, function () { });

          socket.join(slug);

          // emit message to other users
          io.sockets.in(slug).emit('new user logged in', user);

          fn('successfully joined to room \n - room: ' + slug + ' \n - magos: ' + user.magos);

        }

        console.log(io.sockets.manager.rooms);
        console.log(room.users);

      } else {
        fn('error! you cant join this room b/c you are not member of this game.');
      }

    } else if(role === "teacher") {
      // big brother impl.
    }

  });
/*
  socket.on('get room members', function(room, fn) {
    console.log('get room members');
    var members = io.sockets.clients(room.slug);
    console.log(members);
    fn(members);
  });
*/
  socket.on('disconnect', function() {
    // user = _.find(rooms.)

    console.info('user ' + socket.id + ' disconnected from magos!');
    // io.sockets.clients('room')
    // socket.broadcast.emit('user disconnected');
  });

});

/*
  // http://nodejs.org/docs/v0.4.5/api/http.html#http.request
  // get room from server (REST, Django)
  var options = {
    host: 'sportti.dreamschool.fi',
    port: 80,
    path: '/genova/fake200.json'
  };
  //console.log(JSON.stringify(options))

  http.get(options, function(res) {
    console.log("\nGot response statusCode: " + res.statusCode);

    res.on('data', function (json) {
      var data = JSON.parse(json);
      console.log(data);
    });

  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });

  options = {
    host: 'sportti.dreamschool.fi',
    port: 80,
    path: '/genova/fakeUser.json'
  };

  http.get(options, function(res) {
    console.log("\nGot response statusCode: " + res.statusCode);

    res.on('data', function (json) {
      var data = JSON.parse(json);
      console.log(data);
    });

  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
*/

var myMagos = myMagos || {};

myMagos.logEvent = function(log, type, value, game) {

  var log = log || "";

  // query string
  var query = {};
  query.type = type || "";
  query.value = value || "";
  query.game = game || "";
  //
  query = querystring.stringify(query);

  console.log(query);
  // settings for server connection
  options = {
    host: 'sportti.dreamschool.fi',
    port: 80,
    path: '/genova/fake200.json' + query, // :log
    method: 'GET' // POST
  };

  // send log
  http.request(options, function(res) {
    console.log("Logging statusCode: " + res.statusCode);
  }).on('error', function(e) {
    console.log("Logging error: " + e.message);
  });

};

// myMagos.logEvent("user", "event", "some value", "super-magos");

/*

        "sceneElements": [
            {
                "name": "Background Image",
                "type": "background-image",
                "icon": "/assets/img/icons/background-image.png",
                "available": [
                    "intro",
                    "game",
                    "outro"
                ],
                "potions": []
            },
            {
                "name": "Timer",
                "type": "timer",
                "icon": "/assets/img/icons/timer.png",
                "available": [
                    "game"
                ],
                "potions": [
                    "font"
                ]
            },
            {
                "name": "Dialog",
                "type": "dialog",
                "icon": "/assets/img/icons/dialog.png",
                "available": [
                    "game"
                ],
                "potions": [
                    "font",
                    "dialog"
                ]
            },
            {
                "name": "Highscore",
                "type": "highscore",
                "icon": "/assets/img/icons/highscore.png",
                "available": [
                    "intro",
                    "outro"
                ],
                "potions": [
                    "font"
                ]
            },
            {
                "name": "Volume",
                "type": "volume",
                "icon": "/assets/img/icons/volume.png",
                "available": [
                    "intro",
                    "game",
                    "outro"
                ],
                "potions": []
            },
            {
                "name": "Start Game",
                "type": "start-button",
                "icon": "/assets/img/icons/start-button.png",
                "available": [
                    "intro",
                    "outro"
                ],
                "potions": [
                    "font"
                ]
            }
        ]

*/

/*
var editor = io.of('/editor').on('connection', function(client) {

  editor.on('connect', function() {
      console.log('CLIENT ID: ' + client.id);
      editor.emit('user connected');
  });

  editor.on('disconnect', function() {
      // socket.broadcast.emit('user disconnected');
  });

});
*/

/*
var chat = io.of('/chat').on('connection', function (client) {
  client.emit('a message', client.id );
  chat.emit('a message', everyone: 'in', '/chat': 'will get' });
});
*/

/*
  { slug: "super-magos",
    members: [
      {
        userName: "teemu",
        magos: "principes"
      }
    ],
    users: [
        {
          // id: 23320239309932,
          // userName: "teemu",
          magos: "principes"
        },
        {
          magos: "physicus"
        },
        {
          magos: "artifex"
        },
        {
          magos: "musicus"
        },
    game: {
        info: {
            "title": "Super Mario",
            "slug": "super-mario",
            "public": false,
            "clonable": false
        }
      }
    },
    components: [
      { slug: 'player'}
    ]
];
*/
