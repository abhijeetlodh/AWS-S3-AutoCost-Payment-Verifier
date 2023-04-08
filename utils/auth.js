const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate user
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.redirect('/login');
    }
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const user = await User.findOne({ _id: decoded.id, authToken: token });
    if (!user) {
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.render('error', { message: 'Error authenticating user' });
  }
};

module.exports = { isAuthenticated };
