var express = require('express'),
	http = require('http'),
	path = require('path'),
	config = require("./config"),
	_ = require('underscore')._,
	i18next = require('i18next');

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

i18next.init({
	ns: { namespaces: ['magos.lite'], defaultNs: 'magos.lite'},
	fallbackLng: 'en',
    resSetPath: path.join(__dirname, 'locale/__lng__/messages.__ns__.json'),
  	resGetPath: path.join(__dirname, 'public/i18n/__lng__/messages.__ns__.json'),
  	detectLngFromPath: 0,
  	returnObjectTrees: true,
  	saveMissing: false,
    debug: false
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
app.use(i18next.handle);

// serve static resources from public dir
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/media/user-media', express.static(path.join(__dirname, 'user-media')));
app.use(app.router);

i18next.serveClientScript(app).serveDynamicResources(app).serveMissingKeyRoute(app);

i18next.serveWebTranslate(app, {
    i18nextWTOptions: {
      languages: ['fi', 'en', 'it'],
      }
});

app.locals.t = function(key) {
  return i18next.t(key);
};

// authentication
var authenticate = require('./middleware/authenticate');
var play_authenticate = require('./middleware/play_authenticate');

// authorization is used only on selected routes
var authorize = require('./middleware/authorize');

// Routes ***
var pageRoutes = require('./routes/page'),
  	editorRoutes = require('./routes/editor'),
  	playRoutes = require('./routes/play');
app.get('/', pageRoutes.index);
app.get('/edit/:slug', authenticate, authorize, editorRoutes.index);
app.get('/play/:slug', play_authenticate, playRoutes.index);
app.get('/preview/:slug', play_authenticate, playRoutes.index);

// redirect other requests to index
//app.get('*', pageRoutes.index);

// start server
server.listen(app.get('port'), function () {
	console.log('Server listening on port ' + app.get('port'));
});
