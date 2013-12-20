
function requireUser(app, req, res, next) {
  /*
  if (req.session.user) {
    next();
    return;
  }
  */
  //This is pseudocode, just to convey a basic idea...
  //res.redirect("/sign-in?next=" + encodeURIComponent(req.path));
  res.redirect(app.get('djangoUrl') + 'game/login?next=/edit/' + encodeURIComponent(req.path));
}


module.exports = {
  requireUser: requireUser
};
