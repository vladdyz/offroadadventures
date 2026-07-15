const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");
//for geocoding the maps using the MapTiler Cloud
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.newForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    //forward geocoding retrieving latitude/longitude coordinates data for the location
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    //We have access to the Multer file data here (its middleware is called first to parse the data & adds it to req.body), to store any uploaded file(s) data (path & name) in the newly instantiated campground object
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.features[0].geometry;
    campground.images = req.files.map(f => ({url: f.path, filename: f.filename})) //Creates an array of simple objects containing the filename and path for each image added to the campground
    campground.author = req.user._id; //when a user adds another campground to the database, they're registered as its author by using their _id value on the request object
    await campground.save();
    req.flash('success', 'Successfully added a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.showCampground = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews', 
        populate: { //each review has its own (separate) author, a nested populate will enable showing the authors of all of the reviews
            path: 'author'
        }}).populate('author'); //added the author (users) collection since the campground references it, distinguished from above as the author of the campground (not review!)
    // console.log(campground); // DEBUG
    //if the campground cannot be found, display an error and redirect to the main campgrounds page
    if (!campground) {
        req.flash('error', 'Campground not found!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.editForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    //if the campground cannot be found, display an error and redirect to the main campgrounds page
    if (!campground) {
        req.flash('error', 'Campground not found!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    //res.send("IT WORKED")
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    //MapTiler Geo Data updater
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    campground.geometry = geoData.features[0].geometry;
    //Either add images to the array or remove the, and update the db to reflect it
    if (req.files && req.files.length > 0) {
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
        campground.images.push(...imgs);
    }
    await campground.save();
    //When deleting images from a campground, need to remove them on the backend as well (delete from both the MongoDB & Cloudinary server)
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    //if the campground cannot be found, display an error and redirect to the main campgrounds page
    if (!campground) {
        req.flash('error', 'Campground not found!');
        return res.redirect('/campgrounds');
    }
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.destroy = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}