
var fs = require('fs'),
express = require('express'),
params = require('express-params'),
request = require('request'),
querystring = require('querystring'),
_ = require('underscore')._,
util = require("util");

var redis  = require("redis"),
client = redis.createClient(6379, 'localhost');

var app = express(),
http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server);

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
  // io.set('log level', 0); // reduce logging

// redis
client.monitor(function (err, res) {
  console.log("Entering monitoring mode.");
});

client.on("monitor", function (time, args) {
  console.log(time + ": " + util.inspect(args));
});

client.on("error", function (err) {
  console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

// /redis

//var parseCookie = require('connect').utils.parseJSONCookie;
//var MemStore = express.session.MemoryStore;

//var json = JSON.stringify({ vittu: 'paa' });
//console.log(parseCookie());

params.extend(app);

app.use('/static', express.static(__dirname + '/static'));

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});
/*
app.configure('production', function() {
  app.use(express.errorHandler());
});
*/
app.use(express.cookieParser()); // TODO replace memstore with redisstore
///app.use(express.session({ key: 'express.sid', secret: '4YaA3x2Sbv97Q7A3G4qdxSZwqzHbn9', store: MemStore({ reapInterval: 60000 * 10 }) })); // , store: new RedisStore

app.use(function(err, req, res, next){
 // console.error(err.stack);
 res.send(500, 'Something broke!');
});


io.configure(function () {
  // connection types
  io.set('transports', ['websocket', 'xhr-polling']); // 'flashsocket',
  // authentication
  /*
  io.set('authorization', function (handshakeData, callback) {

    // check if there's a cookie header
    if (handshakeData.headers.cookie) {
        // if there is, parse the cookie


 //     handshakeData.cookie = connect.utils.parseJSONCookie(handshakeData.headers.cookie);

   //     handshakeData.cookie = express.parseCookie(handshakeData.headers.cookie);
//console.log("VITTU SAATANA!")
//console.log(handshakeData.headers.cookie);
//console.log(express.cookieParser(handshakeData.headers.cookie));
//console.log(handshakeData.headers.cookie['express.sid']);
        // note that you will need to use the same key to grad the
        // session id, as you specified in the Express setup.
 //       handshakeData.sessionID = handshakeData.headers.cookie['express.sid'];

 //       console.log('session auth socket.io setistä: ' + handshakeData.sessionID);

} else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
     }
    // accept the incoming connection
    //accept(null, true);

    callback(null, true); // error first callback style
  });
*/
});

// Routes

app.param('slug', /[a-zA-Z0-9-]+$/);

app.get('/game/:slug', function(req, res) {
  res.sendfile(__dirname + '/game/index.html');
});

app.get('/editor/:slug', function(req, res) {

  var slug = req.params.slug[0];
  //console.log(req);

/*  if(_.isUndefined(req.session.user)) {
    req.session.user = "matti.vanhanen";
    req.session.role = "student";
 //   console.log("SET REQUEST SESSION:");
 //   console.log(" - user: " + req.session.user);
  } else {
  //  console.log("GET REQUEST SESSION:");
  //  console.log(" - user: " + req.session.user);
}*/
//  console.log('req.sessionID');
//  console.log(req.session);
 // console.log("__dirname");
 // console.log(__dirname);
 res.sendfile('index.html');
  // res.sendfile(__dirname + '/index.html');
});

// fallback response
app.get('/', function(req, res) {
  res.send('Hello from Magos');
});

server.listen(9001);

var editor = io.of('/editor') /*.authorization(function (handshakeData, callback) {

  console.dir(handshakeData);
  handshakeData.foo = 'baz';
  callback(null, true);

}) */
.on('connection', function (socket) {

  //console.log('socket.handshake.user: ');
  //console.dir(socket.handshake.user);

  socket.on('connect', function() {
    console.log('client connected, client id: ' + socket.id);
  });

  socket.on('connect_failed', function (reason) {
    console.error('unable to connect to namespace', reason);
  });

  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function () {
    console.info('sucessfully established a connection with the namespace');
  });

  socket.on('shout', function (shout, fn) {
    console.log("Shout: " + JSON.stringify(shout) + "\n");

    if(_.isObject(shout)) {
      /*
      var credentials = {};
      socket.get('credentials', function (err, _credentials) {
        credentials = _credentials;
      });
      //console.log(credentials.slug);
      //message = { 'name': credentials.firstName, 'magos': credentials.magos, 'message': message };
      */

      var slug = shout.slug;
      delete shout.slug;

      // TODO add shouts to redis list to add easy log load for new user
      socket.broadcast.in(slug).emit('shout', shout);

      fn(shout);

    }

  });

  socket.on('saveGame', function(mode, game, fn) {


    // get this from session
    var slug = 'super-magos';

    var json = JSON.stringify(game);

    // saving mode to redis or redis&django
    if(mode === 0) {
      // just in redis
      client.set('game:'+slug, json, redis.print);

    } else {
      // redis and django
      client.set('game:'+slug, json, redis.print);
      //
      // TODO send game to django
    }

    fn(true);
  });

  socket.on('joinGame', function(slug, fn) {

    slug = _.isString(slug) ? slug : '';

    var game = {};

    socket.join(slug); // move to other event

    client.get('game:'+slug, function(err, data) {

      if (data === null) {
          // query from django and set to redis
          var json = fs.readFileSync('static/json/fakeGame.json', 'utf8');

          game = JSON.parse(json);

          client.set('game:'+slug, json, redis.print);
          // request.get('http://sportti.dreamschool.fi/genova/fakekjkjkljlGame2.json?kksljlkjkjkljklj' + slug, function (error, response, body) {
          // if (!error && response.statusCode == 200) {} });
        }
        else {
          game = JSON.parse(data);
        }

        fn(game);
      });
  });

  socket.on('getSceneComponents', function (noop, fn) {
      // read json file
      var json = fs.readFileSync('static/json/sceneComponents.json', 'utf8');
      // parse obj's
      var result = JSON.parse(json);
      // return components
      fn(result);
    });

  socket.on('getSkillsets', function (noop, fn) {
      // read json file
      var json = fs.readFileSync('static/json/skillsets.json', 'utf8');
      // parse obj's
      var result = JSON.parse(json);
      // return components
      fn(result);
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

    socket.set('credentials', credentials, function () {});

    var userName = "";
    socket.get('credentials', function (err, credentials) {
      userName = credentials.userName;
    });

    console.log(credentials);

    fn('user´s credentials saved');

  });
/*
  socket.on('join-room', function (slug, fn) {

    var credentials = {};
    socket.get('credentials', function (err, _credentials) {
      credentials = _credentials;
    });

    var room = _.find(rooms, function(obj) { return obj.slug === slug; });

    if(!_.isObject(room)) {

      var json = fs.readFileSync('statme.json', 'utf8');

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
*/
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
