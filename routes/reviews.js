const express = require('express');
const router = express.Router({mergeParams: true}); //because we use an :id in the route prefixes here, we need to include this option to have access to it
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isReviewAuthor, validateReview } = require('../middleware'); //protecting routes behind auth middleware

//the route and views logic has been re-organized using controllers, this file now requires them
const reviews = require('../controllers/reviews')

//all of the routes here (originally from index.js) prefixed with "/campgrounds/:id/reviews" 
//updated to use controllers for rendering views and navigating routes, the logic below has been localized to controllers/reviews.js


//Route to add reviews (post) for a specific campsite with client and server side validation middleware
router.post('/', isLoggedIn, validateReview, catchAsync (reviews.createReview));

//Route to delete a review from a specific campsite, using the unique _id PKs for both the campsite and selected review
router.delete('/:reviewId', isLoggedIn, catchAsync(isReviewAuthor), catchAsync(reviews.destroy));


module.exports = router; //exports the router and its saved routes from above