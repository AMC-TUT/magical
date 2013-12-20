var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
  port: process.env.EXPRESS_PORT || 8082,
  ip: process.env.EXPRESS_HOST || '127.0.0.1',
  djangoUrl: 'http://localhost:8000/'
};

config.redis = {
  port: process.env.REDIS_PORT || 6379,
  ip: process.env.REDIS_HOST || '127.0.0.1'
};

/*
config.mongodb = {
  port: process.env.MONGODB_PORT || 27017,
  host: process.env.MONGODB_HOST || 'localhost'
};
*/

if (PRODUCTION) {
  	//use different mongodb in production here, for example
	config.express.djangoUrl = 'http://magos.pori.tut.fi/';
}

//config.db same deal
//config.email etc
//config.log
