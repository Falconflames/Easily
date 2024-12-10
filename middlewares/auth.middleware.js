export default function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
      } 
      else {
        req.session.redirectTo = req.originalUrl;
        return res.redirect('/login');
      }
    }
