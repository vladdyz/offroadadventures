//since the review model uses the campgrounds model, it is required too
const Campground = require('../models/campground');
const Review = require('../models/review');



module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id; //assigns each new review object an author property corresponding to the value of the currently signed-in user (same as campground post route)
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Successfully added your review!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.destroy = async (req, res) => {
    const { id, reviewId} = req.params; //Destructuring the values from params into variables (to avoid using req.params prefix below)
    Campground.findByIdAndUpdate(id, {$pull: { reviews: reviewId }}); //remove the reference from the campground to the reviewId we wish to delete, by pulling it from the array
    await Review.findByIdAndDelete(reviewId); //delete the review
    req.flash('success', 'Successfully removed your review!');
    res.redirect(`/campgrounds/${id}`);
}