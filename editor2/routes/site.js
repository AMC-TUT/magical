module.exports = function(app) {

	// index route
	app.get('/', function(req, res) {res.render('index')});

	// second route
	app.get('/editor/:gameslug', function(req, res){
	  var gameslug = req.params.gameslug;
	  client.get('django_session:' + req.cookies.sessionid, function(err, data) {
		  console.log(data);				  
		  res.render('editor', {
		    pageData: {
		      gameslug : gameslug
		    }
		  });

	  });
	});

}
