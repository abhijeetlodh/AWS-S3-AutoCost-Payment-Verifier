const express = require('express');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const uuid = require('uuid');

const config = require('./config/aws');
const Payment = require('./models/payment');
const User = require('./models/user');
const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const user = await User.findOne({ _id: decoded.id, authToken: token });
    if (!user) {
      return res.redirect('/login');
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.log(err);
    res.redirect('/login');
  }
};

// Routes
app.use('/', indexRoutes);
app.use('/api', isAuthenticated, apiRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
