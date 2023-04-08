const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const User = require('../models/user');
const Payment = require('../models/payment');
const { sendPaymentReminderEmail } = require('../utils/email');

// Homepage
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
    const totalAmount = payments.reduce((acc, curr) => acc + curr.amount, 0);
    res.render('index', { payments, totalAmount });
  } catch (err) {
    console.log(err);
    res.render('error', { message: 'Error fetching payments' });
  }
});

// Register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle user registration
router.post('/register', async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.render('register', { message: error.details[0].message });
  }
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render('register', { message: 'Email already in use' });
    }
    const newUser = new User(req.body);
    await newUser.save();
    const token = newUser.generateAuthToken();
    res.cookie('authToken', token);
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.render('error', { message: 'Error creating user' });
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Handle user login
router.post('/login', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.render('login', { message: error.details[0].message });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.render('login', { message: 'Invalid email or password' });
    }
    const isMatch = await user.matchPassword(req.body.password);
    if (!isMatch) {
      return res.render('login', { message: 'Invalid email or password' });
    }
    const token = user.generateAuthToken();
    res.cookie('authToken', token);
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.render('error', { message: 'Error logging in' });
  }
});

// Logout
router.get('/logout', isAuthenticated, async (req, res) => {
  try {
    req.user.authToken = null;
    await req.user.save();
    res.clearCookie('authToken');
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.render('error', { message: 'Error logging out' });
  }
});

module.exports = router;
