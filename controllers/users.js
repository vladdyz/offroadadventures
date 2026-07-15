const User = require('../models/user');


module.exports.registrationForm =  (req, res) => {
    res.render('users/register');
}

module.exports.register = async(req, res, next) => {
    try { //although this function is already wrapped in a catchAsync error handler, this is to display a specific simplified custom error message incase registration goes wrong
        const { email, userName, password } = req.body;
        const user = new User({ email, userName });
        const reg = await User.register(user, password);
        //after the user successfully registers, it should immediately log them in
        req.login(reg, err => {
            if(err) return next(err);
            req.flash('success', 'Welcome to Campgrounds!');
            const redirectUrl = res.locals.returnTo || '/campgrounds'; //either return the user to the page they were previously on, or default to campgrounds
            res.redirect(redirectUrl);
        })
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

module.exports.loginForm = (req, res) => {
    res.render('users/login');
}

module.exports.loggedIn = (req, res) => {
    req.flash('success', 'Welcome Back!');
    const prevPage = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(prevPage);
}

module.exports.logOut = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}