const express = require('express')
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const passport = require('passport');
const { storeReturnTo } = require('../middleware');


//updated to use controllers for rendering views and navigating routes, the logic below has been localized to controllers/users.js
const users = require('../controllers/users')

//different requests chained together for the same route using router.route to reduce redundancy

router.route('/register')
    //Render the registration form
    .get(users.registrationForm)
    //Successfully register a mew account
    .post(catchAsync(users.register));

router.route('/login')
    //Render the login form
    .get(users.loginForm)
    //Successfully authenticate
    .post(storeReturnTo, passport.authenticate('local', {failureFlash: true, failureRedirect: '/login', keepSessionInfo: true}), users.loggedIn)

router.get('/logout', users.logOut); 


module.exports = router;