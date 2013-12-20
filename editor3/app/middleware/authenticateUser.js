
function authenticateUser(loginUrl) {
	console.log(loginUrl);
	return function(req, res, next) {
		next();
	}
}

module.exports = authenticateUser;
