var fs=require("fs"),express=require("express"),params=require("express-params"),request=require("request"),querystring=require("querystring"),_=require("underscore")._,app=express(),http=require("http"),server=http.createServer(app),io=require("socket.io").listen(server);io.enable("browser client minification"),io.enable("browser client etag"),io.enable("browser client gzip");var MemStore=express.session.MemoryStore;params.extend(app),app.use("/static",express.static(__dirname+"/static")),app.configure("development",function(){app.use(express.errorHandler({dumpExceptions:!0,showStack:!0}))}),app.configure("production",function(){app.use(express.errorHandler())}),app.use(express.cookieParser()),app.use(express.session({key:"express.sid",secret:"4YaA3x2Sbv97Q7A3G4qdxSZwqzHbn9",store:MemStore({reapInterval:6e5})})),app.use(function(e,t,n,r){console.error(e.stack),n.send(500,"Something broke!")}),io.configure(function(){io.set("transports",["websocket","xhr-polling"]),io.set("authorization",function(e,t){if(!e.headers.cookie)return accept("No cookie transmitted.",!1);t(null,!0)})}),app.param("slug",/[a-zA-Z0-9-]+$/),app.get("/game/:slug",function(e,t){t.sendfile(__dirname+"/game/index.html")}),app.get("/editor/:slug",function(e,t){var n=e.params.slug[0];console.log(e),_.isUndefined(e.session.user)?(e.session.user="matti.vanhanen",e.session.role="student",console.log("SET REQUEST SESSION:"),console.log(" - user: "+e.session.user)):(console.log("GET REQUEST SESSION:"),console.log(" - user: "+e.session.user)),console.log("req.sessionID"),console.log(e.session),console.log("__dirname"),console.log(__dirname),t.sendfile(__dirname+"/index.html")}),app.get("/",function(e,t){t.send("Hello from Magos")}),server.listen(9001);var rooms=[],editor=io.of("/editor").on("connection",function(e){console.log("socket.handshake.user: "),console.dir(e.handshake.user),e.on("connect",function(){console.log("client connected, client id: "+e.id)}),e.on("connect_failed",function(e){console.error("unable to connect to namespace",e)}),e.on("error",function(e){console.error("Unable to connect Socket.IO",e)}),e.on("connect",function(){console.info("sucessfully established a connection with the namespace")}),e.on("shout",function(t,n){console.log("Shout: "+JSON.stringify(t)+"\n");if(_.isObject(t)){var r=t.slug;delete t.slug,e.broadcast.in(r).emit("shout",t),n(t)}}),e.on("joinGame",function(t,n){t=_.isString(t)?t:"",e.join(t);var r=_.find(rooms,function(e){return e.slug===t});_.isUndefined(r)?request.get("http://sportti.dreamschool.fi/genova/fakeGame.json?"+t,function(e,t,r){if(!e&&t.statusCode==200){var i=JSON.parse(r);rooms.push(i),n(i)}}):n(r)}),e.on("getSceneComponents",function(e,t){var n=fs.readFileSync("static/json/sceneComponents.json","utf8"),r=JSON.parse(n);t(r)}),e.on("getSkillsets",function(e,t){var n=fs.readFileSync("static/json/skillsets.json","utf8"),r=JSON.parse(n);t(r)}),e.on("getLanguages",function(e,t){request.get("http://sportti.dreamschool.fi/genova/fakeLanguages.json",function(e,n,r){!e&&n.statusCode==200?t(JSON.parse(r)):e&&(console.log("ERROR while getting languages"),t([]))})}),e.on("set-user-credentials",function(t,n){e.set("credentials",t,function(){});var r="";e.get("credentials",function(e,t){r=t.userName}),console.log(t),n("user´s credentials saved")}),e.on("join-room",function(t,n){var r={};e.get("credentials",function(e,t){r=t});var i=_.find(rooms,function(e){return e.slug===t});if(!_.isObject(i)){var s=fs.readFileSync("static/game.json","utf8");i=JSON.parse(s),console.log(i.title),rooms.push(i)}if(r.role==="student"){var o=_.find(i.authors,function(e){return e.userName===r.userName});if(_.isObject(o)){var u=_.filter(i.users,function(e){return _.isUndefined(e.userName)}),a=_.find(u,function(e){return e.magos===o.magos});if(!_.isUndefined(a))a=_.find(i.users,function(e){return e.magos===o.magos}),a.userName=r.userName,a.role=r.role,a.id=e.id,r.magos=a.magos,r.room=t,r.slug=t,e.set("credentials",r,function(){}),e.join(t),io.sockets.in(t).emit("new user logged in",a),n("successfully joined to room \n - room: "+t+" \n - magos: "+a.magos);else{var f=_.find(u,function(e){return _.isUndefined(e.userName)});a=_.find(i.users,function(e){return e.magos===f.magos}),a.userName=r.userName,a.role=r.role,a.id=e.id,r.magos=a.magos,r.room=t,e.set("credentials",r,function(){}),e.join(t),io.sockets.in(t).emit("new user logged in",a),n("successfully joined to room \n - room: "+t+" \n - magos: "+a.magos)}console.log(io.sockets.manager.rooms),console.log(i.users)}else n("error! you cant join this room b/c you are not member of this game.")}else role==="teacher"}),e.on("disconnect",function(){console.info("user "+e.id+" disconnected from magos!")})}),myMagos=myMagos||{};myMagos.logEvent=function(e,t,n,r){var e=e||"",i={};i.type=t||"",i.value=n||"",i.game=r||"",i=querystring.stringify(i),console.log(i),options={host:"sportti.dreamschool.fi",port:80,path:"/genova/fake200.json"+i,method:"GET"},http.request(options,function(e){console.log("Logging statusCode: "+e.statusCode)}).on("error",function(e){console.log("Logging error: "+e.message)})};