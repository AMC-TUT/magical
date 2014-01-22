var express = require('express'),
	http = require('http'),
	path = require('path'),
	config = require("./config"),
	_ = require('underscore')._;

// we have to remove all rooms at startup
var roomManager = require('./lib/room_manager_redis');
roomManager.removeAllRooms();

//console.log(process.env.NODE_ENV);

var app = express();
var server = http.createServer(app);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

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
// authentication is used on all routes
app.use(require('./middleware/authenticate'));
app.use(app.router);


// authorization is used only on selected routes
var authorize = require('./middleware/authorize');

// Routes ***
var pageRoutes = require('./routes/page'),
  	editorRoutes = require('./routes/editor'),
  	playRoutes = require('./routes/play');
app.get('/', pageRoutes.index);
app.get('/edit/:slug', authorize, editorRoutes.index);
app.get('/play/:slug', playRoutes.index);

// redirect other requests to index
//app.get('*', pageRoutes.index);

// start server
server.listen(app.get('port'), function () {
	console.log('Server listening on port ' + app.get('port'));
});
