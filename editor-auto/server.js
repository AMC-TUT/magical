var express = require('express'),
	http = require('http'),
	path = require('path'),
	config = require("./config");
	redis = require("redis"),
  	redisClient = redis.createClient(config.redis.port, config.redis.ip);

//console.log(process.env.NODE_ENV);

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server, { resource: '/socket.io' });

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 2); // logging: 2 => reduced, 10 => all
io.configure(function() {
  io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('port', config.express.port);
app.engine('html', require('ejs').renderFile);
app.set('djangoUrl', config.express.djangoUrl);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('magos-cookie-2k13'));
app.use(express.session());

// serve static resources from public dir
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/media/user-media', express.static(path.join(__dirname, 'user-media')));

app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes ***
var pageRoutes = require('./routes/page');
  	/*
  	socketRoutes = require('./routes/auth'),
  	eventRoutes = require('./routes/event');
	*/
app.get('/', pageRoutes.index);
app.get('/edit/:slug', pageRoutes.game);
//app.get('/play/:slug', pageRoutes.game);

// redirect other requests to index
//app.get('*', pageRoutes.index);

// Socket communications ***
io.sockets.on('connection', function(socket) {
	[
	  "./sockets/socket_connection",
	  "./sockets/socket_game"
	].forEach(function (socketRoute) {
	    require(socketRoute).listen(io, socket);
	});
});


// start server
server.listen(app.get('port'), function () {
	console.log('Server listening on port ' + app.get('port'));
});
