var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
  port: process.env.EXPRESS_PORT || 9001,
  ip: process.env.EXPRESS_HOST || '127.0.0.1',
  djangoUrl: 'http://10.0.1.6' //10.0.1.6'
};

config.redis = {
  port: process.env.REDIS_PORT || 6379,
  ip: process.env.REDIS_HOST || '127.0.0.1'
};

if (PRODUCTION) {
  //use different mongodb in production here, for example
	config.express.djangoUrl = 'http://magos.pori.tut.fi';
}
