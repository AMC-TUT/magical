// request https://github.com/mikeal/request
// express http://expressjs.com/
var fs = require('fs'),
  express = require('express'),
  params = require('express-params'),
  request = require('request'),
  config = require("./config"),
  path = require('path'),
  querystring = require('querystring'),
  _ = require('underscore')._,
  util = require('util');

var redis = require("redis"),
    client = redis.createClient(config.redis.port, config.redis.ip);

var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server,  { resource: '/socket.io' });

var globalSessionObj = null;

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 2); // reduce logging

app.set('djangoUrl', config.express.djangoUrl);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('magos-cookie-2k13'));
app.use(express.session());

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/editor/user-media', express.static(__dirname + '/user-media'));

app.use(function(err, req, res, next) {
  res.send(500, 'Something broke!');
});

io.configure(function() {
  // connection types
  io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});


/**
 * ROUTES
 */
app.get('/edit/:slug', function(req, res) {
  var slug = req.params.slug;
  // if sessionid or csrftoken equals undefined redirect to login page
  if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
    // if no session exists
    res.redirect(config.express.djangoUrl + '/game/login?next=/editor/' + req.url);
    return false;
  }
  // query django session data from Redis
  //console.log(req.cookies.sessionid);
  client.get('django_session:foobar', function(err, data) {
    //console.log('FOOBAR: ' + data);
  });

  client.get('django_session:' + req.cookies.sessionid, function(err, data) {
    //console.log('redis data: ', data);
    if(_.isNull(data)) {
      // if no session info in redis
      res.redirect(config.express.djangoUrl + '/game/login?next=/editor/' + req.url);
      return false;
    }

    var sessionObj = myMagos.parseSessionObject(data);
    //console.log(sessionObj);
    // if no valid logged in user
    if(_.isUndefined(sessionObj.userName)) {
      res.redirect(config.express.djangoUrl + '/game/login?next=/editor/' + req.url);
      return false;
    }

  });

  res.sendfile(__dirname + '/index.html');

});


// game play preview
app.get('/play/:slug', function(req, res) {
  var slug = req.params.slug;
  res.sendfile(__dirname + '/play/index.html');
});


// fallback response
app.get('/', function(req, res) {
  res.redirect(config.express.djangoUrl);
});


/**
 * START SERVER
 */
server.listen(9001);


/**
 * EDITOR SOCKET EVENTS
 */

var editor = io.sockets.on('connection', function(socket) {

  var roomName = null, // slug
      maxAuthors = 4;

  socket.on('connect', function(data) {
    //console.log('client connected, client id: ' + socket.id);
    //myMagos.connect(socket, data);
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

    if(globalSessionObj) {
      socket.set('username', globalSessionObj.userName, function() {});
      socket.set('lang', globalSessionObj.lang, function() {});
      socket.set('org', globalSessionObj.org, function() {});
      socket.set('role', globalSessionObj.role, function() {});

      credentials.lang = globalSessionObj.lang;
      credentials.userName = globalSessionObj.userName;
      credentials.org = globalSessionObj.org;
      credentials.role = globalSessionObj.role;
      credentials.firstName = globalSessionObj.firstName;
      credentials.lastName = globalSessionObj.lastName;

      ////console.log(globalSessionObj);
      fn(credentials);
    } else {
      fn(false);
    }

  });

  socket.on('shout', function(shout, fn) {
    socket.get('slug', function(err, slug) {
      if(_.isObject(shout)) {
        socket.broadcast.in(slug).emit('shout', shout);
        fn(shout);
      }
    });
  });

  socket.on('addGameComponent', function(item, fn) {
    //console.log('SOCKET: addGameComponent');
    socket.get('slug', function(err, slug) {
      //console.log(item);
      if(_.isObject(item)) {
        socket.broadcast.in(slug).emit('addGameComponent', item);
        fn(item);
      }
    });
  });

  socket.on('removeGameComponent', function(componentSlug, fn) {
    //console.log('SOCKET: removeGameComponent');
    //console.log(componentSlug);
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('removeGameComponent', componentSlug);
      fn(componentSlug);
    });
  });

  socket.on('updateGameComponent', function(componentSlug, gameComponent, fn) {
    //console.log('SOCKET: updateGameComponent');
    //console.log(componentSlug);
    //console.log(gameComponent);
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('updateGameComponent', componentSlug, gameComponent);
      fn(componentSlug);
    });
  });

  socket.on('addUser', function(user, fn) {
    //console.log('SOCKET: addUser');
    //console.log(user);
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('addUser', user);
      fn(user);
    });
  });

  socket.on('saveGameComponentToCanvas', function(component, sceneName, fn) {
    //console.log('SOCKET: saveGameComponentToCanvas');
    //console.log(component);
    //console.log(sceneName);
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('saveGameComponentToCanvas', component, sceneName);
      fn(component, sceneName);
    });
  });

  socket.on('removeGameComponentFromCanvas', function(component, sceneName, fn) {
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('removeGameComponentFromCanvas', component, sceneName);
      fn(component, sceneName);
    });
  });

  socket.on('potionBusy', function(potion, busy, fn) {
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('potionBusy', potion, busy);
      fn(potion);
    });
  });

  socket.on('saveSceneComponentToCanvas', function(component, sceneName, fn) {
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('saveSceneComponentToCanvas', component, sceneName);
      fn(component, sceneName);
    });
  });

  socket.on('removeSceneComponentFromCanvas', function(component, sceneName, fn) {
    //console.log('SOCKET: removeSceneComponentFromCanvas');
    //console.log(component);
    //console.log(sceneName);
    socket.get('slug', function(err, slug) {
      socket.broadcast.in(slug).emit('removeSceneComponentFromCanvas', component, sceneName);
      fn(component, sceneName);
    });
  });



  socket.on('userChangedMagos', function(user, newMagos, fn) {
    //console.log('SOCKET: userChangedMagos');
    socket.get('slug', function(err, slug) {

      client.get('room:' + slug, function(err, roomData) {
        var oldMagos = user.magos;
        // is magos in use?
        roomData = JSON.parse(roomData);
        roomData = myMagos.changeUserMagos(roomData, user, newMagos);

        // persist change
        var jsonRoomData = JSON.stringify(roomData);
        client.set('room:' + slug, jsonRoomData, redis.print);
        var data = {
          'user' : user,
          'newMagos' : newMagos,
          'oldMagos' : oldMagos
        };
        //console.log(data);
        socket.broadcast.in(slug).emit('userChangedMagos', data);
        fn(data);
      });

    });
  });

  socket.on('canUserChangeMagos', function(gameSlug, user, magos, fn) {
    //console.log('SOCKET: canUserChangeMagos');
    //console.log('User ' + user.userName + ' requests change from ' + user.magos + ' to ' + magos);

    var sessionid = '';
    socket.get('sessionid', function(err, name) {
      sessionid = name;
    });

    client.get('room:' + gameSlug, function(err, roomData) {
      // is target magos in use?
      roomData = JSON.parse(roomData);
      //console.log('We have room data: ' + JSON.stringify(roomData));
      var magosUser = myMagos.getMagosUser(roomData, magos);

      if(!magosUser) {
        //console.log('MAGOS IS FREE TO USE');
        // presist change
        fn(true);
      } else {
        //console.log('MAGOS IS TAKEN, HAVE TO GET PERMISSION');
        // ask permission

        var targetUser = _.find(roomData.authors, function (author) { return magosUser.userName == author.userName; });
        if(targetUser) {
          if(targetUser.socket_id) {
            io.sockets.socket(targetUser.socket_id).emit("foobar", user);
          }
        }

        fn(false);

      }


    });

  });

  socket.on('saveGame', function(mode, game, fn) {
    var result = false;

    //console.log('----- GAME:');
    //console.log(game);

    socket.get('slug', function(err, slug) {
      //console.log('----- SAVEGAME _____:' + slug);
      // game in json format
      var json = JSON.stringify(game);
      //socket.broadcast.in(slug).emit('refreshRevision', game);
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
          url: config.express.djangoUrl + '/api/v1/games/' + slug,
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
    //console.log('JOIN GAME');

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
      var game;

      if(_.isNull(data)) {
        // query from django and set to redis
        // set session cookies for request
        var j = myMagos.createCookieJar(sessionid, csrftoken);
        // get game request
        request.get({
          url: config.express.djangoUrl + '/api/v1/games/' + slug,
          jar: j
        }, function(error, response, body) {
          if(!error && response.statusCode == 200) {
            game = JSON.parse(body);
            //console.log(game);
            if(_.isObject(game)) {
              game.revision = myMagos.checkGameRevision(game.revision);
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

        if(role === 'teacher') {
          // join or make a room with slug name
          socket.join(slug);
          roomName = slug;

        } else if(role === 'student') {
          var user = _.find(game.authors, function(author) { return author.userName === userName; });

          // join or make a room with slug name
          socket.join(slug);
          roomName = slug;
        }

        fn(game);
      }
    });
  });

  socket.on('joinRoom', function(gameData, fn) {
    //console.log('-- JOIN ROOM');
    if(!_.isNull(gameData)){
      //var gameData = JSON.parse(data);
      if(_.isObject(gameData)) {
        // is user an author of this game?
        // TODO: what to do with teachers?
        var isTeacher = (globalSessionObj.role == 'teacher') ? true : false;
        //console.log(isTeacher);
        var authorUserNames = _.pluck(gameData.authors, 'userName');
        //console.log(authorUserNames);
        var isAuthorized = (_.contains(authorUserNames, globalSessionObj.userName)) ? true : false;
        if(isAuthorized) {
          //console.log('User "' + globalSessionObj.userName + '" authorized.');

          client.get('room:' + gameData.slug, function(err, roomData) {
            if(_.isNull(roomData)) {
              // no previously saved room data
              var skillsetsJson = fs.readFileSync(__dirname + '/static/json/skillsets.json', 'utf8');
              // parse obj's
              var skillsetsResult = JSON.parse(skillsetsJson);
              //console.log(skillsetsResult);
              var magoses = [];
              _.each(skillsetsResult, function(obj) {
                obj.user = null;
                magoses.push(obj);
              });
              //console.log(magoses);
              var roomData = {
                slug: gameData.slug,
                authors: [],
                teachers: [],
                magoses: magoses
              };
              if (isTeacher) {
                roomData.teachers.push(globalSessionObj.userName);
              } else {
                // TRY TO ADD MAGOS TO AUTHOR
                var roomData = myMagos.addAuthorToRoom(roomData, socket.id);
                var roomData = myMagos.addMagosToAuthor(roomData);
                //console.log('AFTER NULL data: ');
                //console.log(roomData);
              }
              var jsonRoomData = JSON.stringify(roomData);
              //console.log(jsonRoomData);
              client.set('room:' + gameData.slug, jsonRoomData, redis.print);

            } else {
              // room data exists
              roomData = JSON.parse(roomData);
              //console.log('We have room data: ' + JSON.stringify(roomData));

              if (isTeacher) {
                //console.log("SHOULD ADD TEACHER");
                if(!_.contains(roomData.teachers, globalSessionObj.userName)) {
                  // add teacher
                  roomData.teachers.push(globalSessionObj.userName);
                  //console.log('Teacher added to room.');
                }
              } else {
                // TRY TO ADD MAGOS TO AUTHOR
                var roomData = myMagos.addAuthorToRoom(roomData, socket.id);
                var roomData = myMagos.addMagosToAuthor(roomData);
              }
              var jsonRoomData = JSON.stringify(roomData);
              client.set('room:' + gameData.slug, jsonRoomData, redis.print);
            }
            fn(roomData);
          });


        } else {
          //console.log('User "' + globalSessionObj.userName + '" not authorized!');
          fn(false);
        }
      }
    }


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
    //console.log('>> FILTER: ' + filter);
    var data = {
      'filter': filter || null,
      'width': width || null,
      'height': height || null,
      'limit': limit || 50,
      'offset': offset || 0
    };

    // get images request
    var result = [];
    //console.log(config.express.djangoUrl);
    request.get({
      url: config.express.djangoUrl + '/api/v1/images',
      jar: j,
      qs: data
    }, function(error, response, body) {
      //console.log('TEEEEEEEEEEMUUUUUUUUUUUUUU');
      //console.log(error);
      //console.log(response);
      //console.log(body);
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
    //console.log(result);
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


  socket.on('disconnect', function() {
    console.info('user ' + globalSessionObj.userName + ' (' + socket.id + ') disconnected from magos');
    var slug = '';
    socket.get('slug', function(err, name) {
      slug = name;
    });
    socket.leave(slug); // leave room
    client.get('room:' + slug, function(err, roomData) {
      roomData = JSON.parse(roomData);
      if(!_.isNull(roomData)) {
        if(globalSessionObj.role == 'student') {
          // remove user from authors and free magos
          var userMagos = myMagos.getUserMagos(roomData, globalSessionObj.userName);
          roomData = myMagos.removeUserFromMagos(roomData, globalSessionObj.userName);
          roomData = myMagos.removeUserFromAuthors(roomData);
          //socket.broadcast.in(slug).emit('disconnectUser', globalSessionObj.userName, userMagos);
          //console.log('DISCONNECT FROM ROOM: ' + roomName);
          io.sockets.in(roomName).emit('disconnectUser', {
            userName : globalSessionObj.userName,
            magos: userMagos
          });

          // persist change
          var jsonRoomData = JSON.stringify(roomData);
          client.set('room:' + slug, jsonRoomData, redis.print);
        } else {
          // teacher?

        }
      }
    });
  });

});

/**
 *
 *  MAGOS Helper functions
 *
 */
var myMagos = myMagos || {};

myMagos.connect = function(socket, data) {
  //console.log('CONNECT SOCKET');
  //console.log(data);
};


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
    url: config.express.djangoUrl + '/api/v1/logs/' + slug,
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
  //console.log('parseSessionObject...');
  //console.log(data);
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
      //console.log('There was an error when parsing session data. ' + e.message);
    }

  }

  globalSessionObj = sessionObj; // save for later use
  return sessionObj;
};


myMagos.addAuthorToRoom = function(roomData, socket_id) {
  var roomAuthors = _.pluck(roomData.authors, 'userName');
  ////console.log(roomAuthors);
  ////console.log('ADD AUTHOR TO ROOM FUNCTION: ' + _.indexOf(roomAuthors, globalSessionObj.userName));
  if(_.indexOf(roomAuthors, globalSessionObj.userName) == -1 && roomAuthors.length < 4) {
    // add new authorized user if there's room
    roomData.authors.push({'userName': globalSessionObj.userName, 'socket_id': socket_id });
    //console.log('Author ' + globalSessionObj.userName + ' added to room.');
    ////console.log(roomData);
  } else if(_.indexOf(roomAuthors, globalSessionObj.userName) != -1) {
    // update existing user information
    roomData.authors = _(roomData.authors).reject(function(el) { return el.userName === globalSessionObj.userName; });
    roomData.authors.push({'userName': globalSessionObj.userName, 'socket_id': socket_id });
    //console.log('Author ' + globalSessionObj.userName + ' room information updated.');
    ////console.log(roomData);
  }
  return roomData;
}

myMagos.changeUserMagos = function(roomData, user, targetMagos) {
  //console.log('CHANGE USER MAGOS');
  //console.log('OLD ROOM DATA:');
  //console.log(roomData);
  // release old magos
  roomData = myMagos.removeUserFromMagos(roomData, user.userName);
  // set new magos to user
  roomData = myMagos.addUserToMagos(roomData, user, targetMagos);
  //console.log('NEW ROOM DATA:');
  //console.log(roomData);
  return roomData;
}

myMagos.addMagosToAuthor = function(roomData) {
  var userHasMagos = false;
  _.each(roomData.magoses, function(obj) {
    if(obj.user) {
      if(obj.user.userName == globalSessionObj.userName) userHasMagos = true;
    }
  });
  if( !userHasMagos ) {
    //console.log('Trying to add free magos role to user.');
    // allocate new magos to user
    var freeMagoses = [], reservedMagoses = [];
    _.each(roomData.magoses, function(obj) {
      if(!obj.user) {
        freeMagoses.push(obj);
      } else {
        reservedMagoses.push(obj);
      }
    });
    //console.log('freeMagoses:' + freeMagoses.length);
    //console.log('reservedMagoses:' + reservedMagoses.length);
    if(freeMagoses.length) {
      freeMagoses[0].user = globalSessionObj;
      //console.log('Magos ' + freeMagoses[0].magos + ' was set to user ' + globalSessionObj.userName);
      roomData.magoses = _.union(freeMagoses, reservedMagoses);
    } else {
      //console.log('No free Magos roles.');
    }
  } else {
    //console.log('User already has magos role.');
  }
  return roomData;
};

// find magos user
myMagos.getMagosUser = function(roomData, magos) {
  var magosUser = null;
  //console.log('GET MAGOS USER');
  _.each(roomData.magoses, function(obj) {
    //console.log('--------->');
    //console.log(obj);
    //console.log('<---------');
    if(obj.magos == magos) {
      //console.log(magos + ' found');
      if(obj.user) {
        //console.log('magos user ' + obj.user.userName);
        magosUser = obj.user;
      }
    }
  });
  //console.log(magosUser);
  return magosUser;
};

// find users magos
myMagos.getUserMagos = function(roomData, userName) {
  var magos = null;
  //console.log('GET USER MAGOS');
  _.each(roomData.magoses, function(obj) {
    if(obj.user) {
      if(obj.user.userName == userName) {
        magos = obj.magos;
      }
    }
  });
  return magos;
};

// Remove user from magos
myMagos.removeUserFromMagos = function(roomData, userName) {
  //console.log('Trying to remove user from magos...');
  var freeMagoses = [], reservedMagoses = [];
  _.each(roomData.magoses, function(obj) {
    if(obj.user) {
      if(obj.user.userName == userName) {
        obj.user = null;
        freeMagoses.push(obj);
        //console.log('...removed');
      } else {
        reservedMagoses.push(obj);
      }
    } else {
      freeMagoses.push(obj);
    }
  });
  //console.log('freeMagoses:' + freeMagoses.length);
  //console.log('reservedMagoses:' + reservedMagoses.length);
  roomData.magoses = _.union(freeMagoses, reservedMagoses);
  return roomData;
};

myMagos.addUserToMagos = function(roomData, user, targetMagos) {
  _.each(roomData.magoses, function(obj) {
    if(obj.magos == targetMagos) {
      user.magos = targetMagos;
      obj.user = user;
      //console.log('added user ' + user.userName + ' to magos ' + obj.magos);
    }
  });
  return roomData;
};

myMagos.removeUserFromAuthors = function(roomData) {
  var activeAuthors = [];
  _.each(roomData.authors, function(obj) {
    if(obj.userName != globalSessionObj.userName) {
      activeAuthors.push(obj);
    }
  });
  roomData.authors = activeAuthors;
  return roomData;
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

  //console.log("::::REVISON:::::");
  //console.log(revision);

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
  //console.log("REVISION:");
  //console.log(revision);

  return revision;
};
