
var express = require('express'),
    http = require('http'),
    path = require('path'),
    request = require('request'),
    app = express();

var redis = require("redis"),
  client = redis.createClient(6379, 'localhost');

app.set('port', process.env.PORT || 8082);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(app.router);
// serve static resources
app.use('/static', express.static(path.join(__dirname, 'public')));
app.set('title', 'MAGOS Editor');

app.configure('development', function(){
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

console.log(app.set('view options'));
var user = require('./lib/users');

// routes in separate module
require('./routes/site')(app);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
