const { campgroundSchema, reviewSchema } = require('./schemas.js'); //for the validator middleware
const ExpressError = require('./utils/ExpressError'); //for the validator middleware
const Campground = require('./models/campground');
const Review = require('./models/review');


//Login middleware to protect several routes in /campgrounds & /reviews, without authenticating it shouldn't be possible to create/update/delete new campsite or review data
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) { //built-in passport authentication middleware
        req.session.returnTo = req.originalUrl; 
        req.flash('error', 'You must be signed in to do that!');
        return res.redirect('/login'); //need to return this redirect else the res.render statement below still runs
    }
    next();
}

//Remembers the previous page visited by the client and returns them after auth
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

//Extra back-end security middleware to protect any unauthorized CRUD requests from being sent to certain routes via Postman, bypassing the front-end security
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
} 

//client side validation middleware to prevent submitting incorrectly formatted campgrounds
//This was a pain to fix after adding extra features such as image uploads to the schemas
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//client side validation middleware to prevent submitting incorrectly formatted reviews
module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}