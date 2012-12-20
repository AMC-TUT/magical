// request https://github.com/mikeal/request
// express http://expressjs.com/
var fs = require('fs'),
  express = require('express'),
  params = require('express-params'),
  request = require('request'),
  querystring = require('querystring'),
  _ = require('underscore')._,
  util = require("util");

var redis = require("redis"),
  client = redis.createClient(6379, 'localhost');

var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server);

//var djangoUri = 'http://magos.pori.tut.fi/';
var djangoUri = 'http://localhost:8080/';
var globalSessionObj = null;

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

params.extend(app);

app.use('/static', express.static(__dirname + '/static'));
app.use('/user-media', express.static(__dirname + '/user-media'));

app.use(express.cookieParser());

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
  res.send(500, 'Something broke!');
});

io.configure(function() {
  // connection types
  io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});


/**
 * ROUTES
 */

app.param('slug', /[a-zA-Z0-9-]+$/);

app.get('/:slug', function(req, res) {

  var slug = req.url.replace(/^\//, ''); // remove slash, orig: "/super-magos"
  /* // 4 dev
  req.cookies = {};
  req.cookies.sessionid = 'badaa213e2c71e5be7ecf9a37675c12b',
  req.cookies.csrftoken = 'uc71V2tmsVlCtgXEbQqCMboHiCTrBhCR';
  */

  // if sessionid or csrftoken equals undefined redirect to login page
  if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
    // if no session exists
    res.redirect(djangoUri + 'game/login?next=/editor/' + slug);
    return false;
  }

  client.get('django_session:' + req.cookies.sessionid, function(err, data) {
    if(_.isNull(data)) {
      // if no session info in redis
      res.redirect(djangoUri + 'game/login?next=/editor/' + slug);
      return false;
    }

    var sessionObj = myMagos.parseSessionObject(data);

    // if no valid logged in user
    if(_.isUndefined(sessionObj.userName)) {
      res.redirect(djangoUri + 'game/login?next=/editor/' + slug);
      return false;
    }

  });

  res.sendfile(__dirname + '/index.html');
});

// fallback response
app.get('/', function(req, res) {
  res.redirect(djangoUri);
});


/**
 * START SERVER
 */
server.listen(9001);



/**
 * EDITOR SOCKET EVENTS
 */

var editor = io.sockets.on('connection', function(socket) {

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

  socket.on('setUserCredentials', function(credentials, fn) {
    socket.set('slug', credentials.slug, function() {});
    socket.set('sessionid', credentials.sessionid, function() {});
    socket.set('csrftoken', credentials.csrftoken, function() {});

    client.get('game:' + credentials.slug, function(err, data) {
      /*
      //data ==> is not django session data here but game json from redis
      var session = myMagos.parseSessionObject(data);
      console.log('session');
      console.log(session);
      */

      socket.set('username', globalSessionObj.userName, function() {});
      socket.set('lang', globalSessionObj.lang, function() {});
      socket.set('org', globalSessionObj.org, function() {});
      socket.set('role', globalSessionObj.role, function() {});

      credentials.lang = globalSessionObj.lang;
      credentials.userName = globalSessionObj.userName;
      credentials.org = globalSessionObj.org;
      credentials.role = globalSessionObj.role;
      credentials.firstName = 'Mikko';
      credentials.lastName = 'Koskela';

      console.log(globalSessionObj);
      fn(credentials);
    });
  });

  socket.on('shout', function(shout, fn) {
    socket.get('slug', function(err, slug) {
      if(_.isObject(shout)) {
        socket.broadcast.in(slug).emit('shout', shout);
        fn(shout);
      }
    });
  });

  socket.on('saveGame', function(mode, game, fn) {
    var result = false;

    socket.get('slug', function(err, slug) {
      // game in json format
      var json = JSON.stringify(game);
      if(mode === 0) { // saving mode to redis or redis&django
        // redis
        client.set('game:' + slug, json, redis.print);
        result = true;
      } else {
        // redis
        client.set('game:' + slug, json, redis.print);

        // django
        var sessionid = '',
          csrftoken = '';
        var state = game.state,
          revision = JSON.stringify(game.revision);

        // set session cookies for request
        socket.get('sessionid', function(err, name) {
          sessionid = name;
        });
        socket.get('csrftoken', function(err, name) {
          csrftoken = name;
        });
        var j = myMagos.createCookieJar(sessionid, csrftoken);

        // game update request
        request.put({
          url: djangoUri + 'api/v1/games/' + slug,
          jar: j,
          form: {
            'state': state,
            'revision': revision
          }
        }, function(error, response, body) {
          if(!error && response.statusCode == 200) {
            result = true;
          }
        });
      }
    });

    fn(result);
  });

  socket.on('joinGame', function(fn) {

    var slug = '',
      sessionid = '',
      csrftoken = '',
      role = '',
      userName = '';

    socket.get('slug', function(err, name) {
      slug = name;
    });
    socket.get('sessionid', function(err, name) {
      sessionid = name;
    });
    socket.get('csrftoken', function(err, name) {
      csrftoken = name;
    });
    socket.get('role', function(err, name) {
      role = name;
    });
    socket.get('username', function(err, name) {
      userName = name;
    });


    client.get('game:' + slug, function(err, data) {
      //
      var game;

      if(_.isNull(data)) {
        // query from django and set to redis
        // set session cookies for request
        var j = myMagos.createCookieJar(sessionid, csrftoken);
        // get game request
        request.get({
          url: djangoUri + 'api/v1/games/' + slug,
          jar: j
        }, function(error, response, body) {
          if(!error && response.statusCode == 200) {
            game = JSON.parse(body);

            if(_.isObject(game)) {
              game.revision = myMagos.checkGameRevision(game.revision.data);

              var json = JSON.stringify(game);
              client.set('game:' + slug, json, redis.print);




              fn(game);
            } else {
              fn(false);
            }
          } else {
            fn(false);
          }
        });

      } else {
        game = JSON.parse(data);

        console.log('role');
        console.log(role);

        if(role === 'teacher') {
          // join or make a room with slug name
          socket.join(slug);

        } else if(role === 'student') {

          var user = _.find(game.authors, function(author) { return author.userName === userName });

          console.log('user:');
          console.log(user);

          // join or make a room with slug name
          socket.join(slug);
        }



        fn(game);
      }
    });
  });

  socket.on('getImageAssets', function(filter, width, height, limit, offset, fn) {
    var slug = '',
      sessionid = '',
      csrftoken = '';

    socket.get('slug', function(err, name) {
      slug = name;
    });
    socket.get('sessionid', function(err, name) {
      sessionid = name;
    });
    socket.get('csrftoken', function(err, name) {
      csrftoken = name;
    });

    // set session cookies for request
    var j = myMagos.createCookieJar(sessionid, csrftoken);
    console.log('>> FILTER: ' + filter);
    var data = {
      'filter': filter || null,
      'width': width || null,
      'height': height || null,
      'limit': limit || 50,
      'offset': offset || 0
    };

    // get images request
    var result = [];

    request.get({
      url: djangoUri + 'api/v1/images',
      jar: j,
      qs: data
    }, function(error, response, body) {
      if(!error && response.statusCode == 200) {

        var assets = JSON.parse(body);

        if(_.isObject(assets)) {
          result = assets.results;
        }
      }

      fn(result);
    });

  });

  socket.on('logEvent', function(log, fn) {
    if(_.isObject(log)) {
      //
      var slug = '',
        sessionid = '',
        csrftoken = '';

      socket.get('slug', function(err, name) {
        slug = name;
      });
      socket.get('sessionid', function(err, name) {
        sessionid = name;
      });
      socket.get('csrftoken', function(err, name) {
        csrftoken = name;
      });

      log.game = slug; // make sure that log binds to right game
      var result = myMagos.logEvent(log, sessionid, csrftoken);

      fn(result);
    } else {
      //
      fn(false);
    }
  });

  socket.on('getHighscore', function(slug, fn) {

    var sessionid = '',
      csrftoken = '';

    socket.get('sessionid', function(err, name) {
      sessionid = name;
    });
    socket.get('csrftoken', function(err, name) {
      csrftoken = name;
    });

    //
    var json = fs.readFileSync(__dirname + '/static/json/fakeHighscore.json', 'utf8'); // ?offset=0&limit=5
    //
    var highscore = JSON.parse(json);
    // callback
    fn(highscore);
  });

  socket.on('getSceneComponents', function(noop, fn) {
    // read json file
    var json = fs.readFileSync(__dirname + '/static/json/sceneComponents.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

  socket.on('getSkillsets', function(noop, fn) {
    // read json file
    var json = fs.readFileSync(__dirname + '/static/json/skillsets.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

  socket.on('getLanguages', function(noob, fn) {
    // read json file
    var json = fs.readFileSync(__dirname + '/static/json/languages.json', 'utf8');
    // parse obj's
    var result = JSON.parse(json);
    // return components
    fn(result);
  });

  /*


    if(credentials.role === "student") {
      //
      var author = _.find(room.authors, function(obj) { return obj.userName === credentials.userName; });

      if(_.isObject(author)) {

        // roles that are not in use right now
        var magoses = _.filter(room.users, function(obj) { return _.isUndefined(obj.userName); });

        // try first join as own role and if that is reserved join first one which is free
        var user = _.find(magoses, function(obj) { return obj.magos === author.magos; });


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

/**
 *
 *  MAGOS Helper functions
 *
 */
var myMagos = myMagos || {};

myMagos.logEvent = function(log, sessionid, csrftoken) {

  // log object
  // - name: editor|user|game
  // - type: event type
  // - value: event value
  // - game: games slug
  query.type = type || "";
  query.value = value || "";
  query.game = game || "";

  var data = {
    'type': log.type,
    'value': log.value,
    'game': log.game
  };

  var slug = log.name || '';

  // set session cookies for request
  var j = myMagos.createCookieJar(sessionid, csrftoken);

  // game update request
  request.put({
    url: djangoUri + 'api/v1/logs/' + slug,
    jar: j,
    form: data
  }, function(error, response, body) {
    if(!error && response.statusCode == 200) {
      return true;
    } else {
      return false;
    }
  });
};

myMagos.parseSessionObject = function(data) {
  var sessionObj = {},
      json_data = {};
  if(_.isString(data)) {
    var enc = myMagos.base64Decode(data);
    try {
      // thank God we have finally JSON
      json_data = JSON.parse(enc);

      sessionObj = {
        'userName': json_data.username,
        'lang': json_data.lang,
        'role': json_data.role,
        'org': json_data.organization,
        'firstName': json_data.firstname,
        'lastName': json_data.lastname
      };

    } catch(e) {
      console.log('There was an error when parsing session data. ' + e.message);
    }
    /*
    var clean = enc.replace(/[^a-z0-9\.]+/ig, '');
    clean = clean.replace(/qX/g, 'X');
    clean = clean.replace(/qU/g, 'U');
    clean = clean.replace(/qu/g, 'u');
    console.log(clean.match(/usernameX[a-z0-9\.]+U/g));
    console.log(clean.match(/firstnameX[a-z0-9\.]+U/g));

    var userName = clean.match(/usernameX[a-z0-9\.]+U/g).join().replace(/U$/, '').split('X')[1];
    var lang = clean.match(/langX[a-z]+U/g).join().replace(/U$/, '').split('X')[1];
    var role = clean.match(/roleX[a-z]+U/g).join().replace(/U$/, '').split('X')[1];
    var organization = clean.match(/organizationX[a-z]+u\./g).join().replace(/u\.$/, '').split('X')[1];
    var firstName = clean.match(/firstnameX[a-z]+U/g).join().replace(/U$/, '').split('X')[1];
    var lastName = clean.match(/lastnameX[a-z]+U/g).join().replace(/U$/, '').split('X')[1];
    */
  }

  console.log('sessionObj:');
  console.log(sessionObj);

  globalSessionObj = sessionObj; // save for later use
  return sessionObj;
};

myMagos.base64Encode = function(unencoded) {
  //
  return new Buffer(unencoded || '').toString('base64');
};

myMagos.base64Decode = function(encoded) {
  //
  return new Buffer(encoded || '', 'base64').toString('utf8');
};

myMagos.createCookieJar = function(sessionid, csrftoken) {
  var j = request.jar();

  var sessionidCookie = request.cookie('sessionid=' + sessionid);
  var csrftokenCookie = request.cookie('csrftoken=' + csrftoken);

  j.add(sessionidCookie);
  j.add(csrftokenCookie);

  return j;
};

myMagos.checkGameRevision = function(revision) {
  if(_.isUndefined(revision) || _.isNull(revision)) {
    revision = {};
  }

  if(_.isString(revision)) {
    revision = JSON.parse(revision);
  }

  if(!_.isObject(revision.canvas)) {
    // fallback 4 dev
    revision.canvas = {
      'blockSize': 48,
      'rows': 8,
      'columns': 12
    };
  }

  if(!_.isArray(revision.gameComponents)) {
    revision.gameComponents = [];
  }

  if(!_.isArray(revision.scenes)) {
    revision.scenes = [{
      'name': 'intro',
      'sceneComponents': [],
      'gameComponents': []
    }, {
      'name': 'game',
      'sceneComponents': [],
      'gameComponents': []
    }, {
      'name': 'outro',
      'sceneComponents': [],
      'gameComponents': []
    }];
  }

  if(!_.isObject(revision.assets)) {
    revision.assets = {
      'audios': [],
      'fonts': []
    };
  }
  console.log("REVISION:");
  console.log(revision);

  return revision;
};
