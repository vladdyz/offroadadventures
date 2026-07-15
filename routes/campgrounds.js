//Organizing all of the campground routes into one file and using the express router to reduce code redundancy & duplication
//Initially, the entry point (index.js) of an earlier version of this project had several routes for "/campgrounds" including POST, GET, optional params (:id), reviews etc.
//They have all been collected here

const express = require('express');
const router = express.Router();
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware'); //protecting routes behind auth middleware
//using multi-part form data encoding types for the campground forms to allow image uploads, requiring middleware to parse it
const multer = require('multer');
const {storage} = require('../cloudinary'); //import the Cloudinary config from index.js in the 'cloudinary' folder
const upload = multer({storage});
//the images are stored on cloudinary with the API key/secret secured as environmental variables, the Mongo database just stores the URLs

//the route and views logic has been re-organized using controllers, this file now requires them
const campgrounds = require('../controllers/campgrounds')

//all of the routes here are prefixed with "/campgrounds" in the index.js entry-point file
//refer to 'controllers/campground.js' for the respective functions containing the logic for the routes below
//routes have been chained together using ".route" for various different requests accessing the same route

router.route('/')
    //Route to display all of the campgrounds
    .get(catchAsync(campgrounds.index)) 
    //Route to add (post) a new campground using the /new route with client and server side validation middleware, uploading any images included in the form to Cloudinary
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground)) //have to use multer(upload.array) first before validate else the image data isnt added yet
    //the issue is that the images must first be uploaded to Cloudinary and added to the request object by multer, only then can the full form data be validated. This is a bit silly.
    //if the new campground form validation fails, the images are still uploaded to Cloudinary for a nonexistant campground

//Route to the page containing the form to add a new campground
router.get('/new', isLoggedIn, campgrounds.newForm)

//added back-end authorization to protect the routes below via middleware function (isLoggedIn), complementing the front-end conditional feature-rendering in the EJS templates

router.route('/:id')
    //Route to display information for a specific campsite using its primary key (_id) in the params
    .get(catchAsync(campgrounds.showCampground))
    //Route to update the selected campground using the information submitted in the /edit page above, with built-in client and server side validation middleware
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground)) 
    //Route to delete a specific campground identified by its unique _id value as the params
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.destroy));


//Building on the route above, an extension to modify the information for a selected campground, rendering the edit page
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.editForm));



module.exports = router; //exports the router and its saved routes from above