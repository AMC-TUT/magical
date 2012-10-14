var fs = require('fs'),
  express = require('express'),
  params = require('express-params'),
  request = require('request'),
  querystring = require('querystring'),
  _ = require('underscore')._,
  util = require("util");

var redis = require("redis"),
  client = redis.createClient(6379, 'localhost');

var RedisStore = require('connect-redis')(express);

var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server);

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
// io.set('log level', 0); // reduce logging

// redis
client.monitor(function(err, res) {
  console.log("Entering monitoring mode.");
});

client.on("monitor", function(time, args) {
  console.log(time + ": " + util.inspect(args));
});

client.on("error", function(err) {
  console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

//var parseCookie = require('connect').utils.parseJSONCookie;
params.extend(app);

app.use('/static', express.static(__dirname + '/static'));

app.configure(function() {
  app.use(express.cookieParser());
  // app.use(express.session({ store: new RedisStore({host: '127.0.0.1', port: 6379, prefix: 'django_session:' }), secret: '#7tzga@)0q=e@fga4qi4b!s!^v)ioaa*@w_9_-n_%=5ki3f%u#' }));
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

app.use(function(err, req, res, next) {
  // console.error(err.stack);
  res.send(500, 'Something broke!');
});

io.configure(function() {
  // connection types
  io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});

// Routes
app.param('slug', /[a-zA-Z0-9-]+$/);

app.get('/:slug', function(req, res) {

  var slug = req.params.slug[0];
  var cookies = myMagos.parseCookies(req.headers.cookie);

  // 4 dev
  cookies = {
    sessionid: '0725f476fcb35990aad27b4d0a22476b',
    csrftoken: 'rQQ52dL1BIP4Mk4Kg2EzA2JQjT4bi1t3'
  };

  // if sessionid or csrftoken equals "" redirect to login page
  if(cookies.sessionid === "" || cookies.csrftoken === "") {
    res.redirect('http://magos.pori.tut.fi/game/login?next=/editor/' + slug);
    return false;
  }

  res.sendfile(__dirname + '/index.html');
});

// fallback response
app.get('/', function(req, res) {
  res.redirect('http://magos.pori.tut.fi/');
});

server.listen(9001);

var editor = io.sockets.on('connection', function(socket) {

  /*
  var client = socket;
  var cookie_string = client.handshake.headers.cookie;
  var parsed_cookies = express.utils.parseCookie(cookie_string);
  var sessionid = parsed_cookies['sessionid'];
  console.log('SESSION ID');
  console.log(sessionid);
  */

  socket.on('connect', function() {
    console.log('client connected, client id: ' + socket.id);
  });

  socket.on('connect_failed', function(reason) {
    console.error('unable to connect to socket.io', reason);
  });

  socket.on('error', function(reason) {
    console.error('Unable to connect socket.io', reason);
  });

  socket.on('connect', function() {
    console.info('sucessfully established a connection with socket.io');
  });

  socket.on('shout', function(shout, fn) {
    // console.log("Shout: " + JSON.stringify(shout) + "\n");
    if(_.isObject(shout)) {
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
      client.set('game:' + slug, json, redis.print);

    } else {
      // redis and django
      client.set('game:' + slug, json, redis.print);
      //
      // TODO send game to django
    }

    fn(true);
  });

  socket.on('joinGame', function(slug, fn) {

    slug = _.isString(slug) ? slug : '';

    var game = {};

    socket.join(slug); // move to other event
    client.get('game:' + slug, function(err, data) {

      if(data === null) {
        // query from django and set to redis
        var json = fs.readFileSync('static/json/fakeGame.json', 'utf8');

        game = JSON.parse(json);

        client.set('game:' + slug, json, redis.print);
        // request.get('http://sportti.dreamschool.fi/genova/fakekjkjkljlGame2.json?kksljlkjkjkljklj' + slug, function (error, response, body) {
        // if (!error && response.statusCode == 200) {} });
      } else {
        game = JSON.parse(data);
      }
      // callback
      fn(game);
    });
  });

  socket.on('getHighscore', function(slug, fn) {
    // console.log('getHighscore')
    slug = _.isString(slug) ? slug : '';
    // GET /v1/highscores/:game
    // query from django
    var json = fs.readFileSync('static/json/fakeHighscore.json', 'utf8'); // ?offset=0&limit=5
    //
    var highscore = JSON.parse(json);
    // callback
    fn(highscore);
  });

  socket.on('getSceneComponents', function(noop, fn) {
    // read json file
    var json = fs.readFileSync('static/json/sceneComponents.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

  socket.on('getSkillsets', function(noop, fn) {
    // read json file
    var json = fs.readFileSync('static/json/skillsets.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

  socket.on('getLanguages', function(noob, fn) {
    // read json file
    var json = fs.readFileSync('static/json/languages.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

   /*
    // make request
    request.get('http://sportti.dreamschool.fi/genova/fakeLanguages.json', function(error, response, body) {
      if(!error && response.statusCode == 200) {
        //
        fn(JSON.parse(body));
      } else if(error) {
        console.log("ERROR while getting languages");
        //
        fn([]);
      }
    });
    */

  /*
  socket.on('set-user-credentials', function(credentials, fn) {

    socket.set('credentials', credentials, function() {});

    var userName = "";
    socket.get('credentials', function(err, credentials) {
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
    path: '/genova/fake200.json' + query,
    // :log
    method: 'GET' // POST
  };

  // send log
  http.request(options, function(res) {
    console.log("Logging statusCode: " + res.statusCode);
  }).on('error', function(e) {
    console.log("Logging error: " + e.message);
  });

};

myMagos.parseCookies = function(cookies) {
  var cookies = cookies.split(';'),
    sessionToken = '',
    csrfToken = '';

  cookies.forEach(function(cookie, i) {
    cookie = cookie.trim();

    var a = cookie.split('='),
      key = a[0] || '',
      value = a[1] || '';

    if(key.match(/sessionid/)) {
      sessionToken = value;
    } else if(key.match(/csrftoken/)) {
      csrfToken = value;
    }
  });

  return {
    sessionid: sessionToken,
    csrftoken: csrfToken
  };

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
