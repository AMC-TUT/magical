/**
 * SITE ROUTES
 */

var _ = require('underscore')._;

function home(req, res) {
  res.render("site/home");
}

function edit(req, res) {
  var slug = req.params.slug;
  magosUser = null;
  console.log(slug);
  /*
  // if sessionid or csrftoken equals undefined redirect to login page
  if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
    // if no session exists
    res.redirect(app.get('djangoUrl') + 'game/login?next=/edit/' + slug);
    return false;
  }
  // query django session data from Redis
  client.get('django_session:' + req.cookies.sessionid, function(err, data) {
    if(_.isNull(data)) {
      // if no session info in redis
      res.redirect(app.get('djangoUrl') + 'game/login?next=/edit/' + slug);
      return false;
    }

    var sessionObj = myMagos.parseSessionObject(data);
    console.log(sessionObj);
    // if no valid logged in user
    if(_.isUndefined(sessionObj.userName)) {
      res.redirect(app.get('djangoUrl') + 'game/login?next=/edit/' + slug);
      return false;
    } else {
      magosUser = sessionObj;
    }
    res.render('site/edit', { layout : 'layout/site' , 'title' : 'MAGOS editor', 'results' : { magosUser: magosUser } });
  });
  */
  res.render('site/edit');

}

// game play preview
function preview(req, res) {
  var slug = req.params.slug;
  //res.sendfile(__dirname + '/play/index.html');
  res.render('site/play', { layout : 'layout/site' , 'title' : 'MAGOS game preview' });
}


function setup(app) {
  app.param('slug', /[a-zA-Z0-9-]+$/);
  app.get('/', home);
  app.get('/edit/:slug', edit);
  app.get('/preview/:slug', preview);
  //app.get('/play/:slug', play);
}

module.exports = setup;


/*

module.exports = function(app) {

  app.param('slug', /[a-zA-Z0-9-]+$/);

  app.get('/editor/:slug', function(req, res) {
    var slug = req.params.slug;
    //var slug = req.url.replace(/^\//, ''); // remove slash, orig: "/super-magos"
    magosUser = null;  
    // if sessionid or csrftoken equals undefined redirect to login page
    if(_.isUndefined(req.cookies) || _.isUndefined(req.cookies.sessionid) || _.isUndefined(req.cookies.csrftoken)) {
      // if no session exists
      res.redirect(app.get('djangoUrl') + 'game/login?next=/editor/' + slug);
      return false;
    }
    // query django session data from Redis
    client.get('django_session:' + req.cookies.sessionid, function(err, data) {
      if(_.isNull(data)) {
        // if no session info in redis
        res.redirect(app.get('djangoUrl') + 'game/login?next=/editor/' + slug);
        return false;
      }

      var sessionObj = myMagos.parseSessionObject(data);
      console.log(sessionObj);
      // if no valid logged in user
      if(_.isUndefined(sessionObj.userName)) {
        res.redirect(app.get('djangoUrl') + 'game/login?next=/editor/' + slug);
        return false;
      } else {
        magosUser = sessionObj;
      }
      res.render('index', { layout : 'layout/site' , 'title' : 'MAGOS editor', 'results' : { magosUser: magosUser } });
    });

    //res.sendfile(__dirname + '/index.html');
  });


  // game play preview
  app.get('/play/:slug', function(req, res) {
    var slug = req.params.slug;
    res.sendfile(__dirname + '/play/index.html');
  });


  // fallback response
  app.get('/', function(req, res) {
    res.redirect(app.get('djangoUrl'));
  });

}
*/