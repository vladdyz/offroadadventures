//While this app is still in development, require the dotenv package to access the private environmental variables
//In production (when this app is deployed) this will be unneccessary as these are stored elsewhere
if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const port = process.env.PORT || 3080
const Campground = require('./models/campground');
const methodOverride = require('method-override'); //Masquerade PUT/GET/POST etc. requests as something else
const ejsMate = require('ejs-mate'); //Layout and partial template stuff for EJS templates to break up our page components into small modules
const Joi = require('joi'); //JavaScript SQL validator
const { campgroundSchema, reviewSchema } = require('./schemas.js'); //the validators
const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');
const Review = require('./models/review');
const campgrounds = require('./routes/campgrounds'); //the js file containing all of the campground routes formerly in this file
const reviews = require('./routes/reviews') //organizing all of the /campgrounds/../reviews routes into one route handler
const users = require('./routes/users') //for the registration/login auth forms
const session = require('express-session'); //using client-sessions and flash messages
const MongoStore = require('connect-mongo'); //for the connect-mongo module to store client sessions
const flash = require('connect-flash'); //displaying one-time messages on pages (ex: 'Succesfully deleted review!' that go away after a refresh)
const helmet = require('helmet'); //HTTP header security middleware
const dbUrl = process.env.MONGO;
process.noDeprecation = true; //To ignore DEP0044: "The `util.isArray` API is deprecated. Please use `Array.isArray()` instead"

//This is to fix potential security issues if the user tries to inject any of the form fields with a query string (ex: search {"$gt": ""} as a username) to try to manipulate the 
//tables in a way that they are not authorized to do so. Any special characters such as "$" or "." should not be permitted into these fields. This is what this module is for.
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

/*
Also possible to replace prohibited characters with a safe alternative, ex:
app.use(mongoSanitize({
    replaceWith: '_',
}))

*/

/* For Development Testing */
/* mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    //These options are deprecated!
    //useNewUrlParser: true,
    //useCreateIndex: true, 
    //useUnifiedTopology: true
})  */

/* For Production */ 
mongoose.connect(dbUrl, {
    //These options are deprecated!
    //useNewUrlParser: true,
    //useCreateIndex: true, 
    //useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=> {
    console.log("Database connected")
});
const yelpdb = db.useDb('yelp');



const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: process.env.SESSION_SECRET
    }
});

store.on("error", function(e) {
    console.log("There was an error with the Mongo session store: ", e)
})




app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');;
app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method')) //method-override is used throughout the app in forms to mimic put/delete requests instead of POST, so we can perform CRUD operations on the data
//An example would be the put/delete routes below accessible through forms within the ejs pages that add a query string to the route, indicating the request type
app.use(express.static(path.join(__dirname, 'public'))); //serving static assets (images, scripts, etc) from the project public directory
const sessionConfig = {
    store, //use Mongo to store session information
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, //extra security for cookies
        secure: process.env.NODE_ENV === "production", //only allowes secure HTTPS connection cookie requests, should be disabled until the app is deployed since it doesn't work on localhost
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //Date is calculated in milliseconds, we add a week to it here
        maxAge: 1000 * 60 * 60 * 24 * 7
        //this ensures that cookies expire after a week, and in cases of authentication the user won't stay logged in forever
    }
};
app.use(session(sessionConfig));
app.use(flash());
//Acceptable sources for the configured content security policy for Helmet
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", 
    "https://mapbox.com",
    "https://fontawesome.com",
    "https://cloudflare.com",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", 
    "https://fontawesome.com",
    "https://mapbox.com",
];
const connectSrcUrls = [
    "https://api.maptiler.com/",
    "https://picsum.photos/400",
    "https://mapbox.com",
    "https://cdn.maptiler.com/",
    "https://cdn.jsdelivr.net", 
    "https://stackpath.bootstrapcdn.com/"
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/",
                "https://picsum.com/",
                "https://picsum.photos/400",
                "https://images.unsplash.com/",
                "https://fastly.picsum.photos/",
                "https://api.maptiler.com/resources/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

//Using passport (passportjs.org), a node library, for the authentication in this app
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
app.use(passport.initialize());
app.use(passport.session()); //middleware for persistent login sessions, must be used after "app.use(session())"
passport.use(new LocalStrategy(
    {
        usernameField: 'userName',
        passwordField: 'password'
    },
    User.authenticate()
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//Flash handler middleware, on every single request from the route handlers below (including the /routes dir), set the flash messages (if they exist) to be accessible through res.locals
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user; //check if the client is signed in, use this to show/hide content depending on what it contains (user or undefined)
    next();
})


app.use('/campgrounds', campgrounds); //prefixing all of the routes from routes/campgrounds.js with campgrounds (which they originally contained, but now we dont have to type it out each time)
app.use('/campgrounds/:id/reviews', reviews); //this route has an even longer prefix including params, slimming it down here makes it easier to parse
app.use('/', users); //all the register/login auth routes are localized into routes/users.js 





app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get('/', (req, res) => {
    res.render("home")
})

// for Render deployment
app.get('/health', (req,res)=>{
    res.status(200).json({status:'ok'});
});



//Error catching 404 for any other route attempted other than those specified above
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

//Error catching middleware for any unexpected errors during the routes
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})