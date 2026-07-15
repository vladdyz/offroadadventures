const mongoose = require('mongoose')
const Review = require('./review')
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

//taking the url from the schema and modifying it slightly to output the thumbnail instead from Cloudify using its image transformation API
//using a virtual since we dont need to store this field in the database, its derived from the original url
ImageSchema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload', '/upload/w_200');
});

//By default, Mongoose doesn't include virtuals when you convert a document to JSON (res.json() function)
//To include virtuals in res.json(), set the toJSON schema option to {virtuals: true }
//Required for the popUpMarkup virtual used in the cluster map, ref below (now the campground object will contain the properties{popUpMarkup:""} virtual within it)
const opts = { toJSON: { virtuals: true }};

const campgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    //added geoJSON support({"type":"Point", "coordinates":[x, y]})
    //Mongoose Schema is very rigid about how it does this for when a location is a point
    //we already have a location field (the name of the city/state/prov/country) so I renamed this one to geometry
    geometry: {
        type: {
            type: String, //Don't do '{location: { type: String}}'
            enum: ['Point'], //location.type must be a 'Point', no other option
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
}, opts);


/*  Added another virtual property to display location information for the geoJSON
    This adds functionality to the cluster map rendered in the campgrounds index page
    Allowing the user to interact with single coordinate points on the map to activate a popup text displaying the link to the campground */
campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0,25)}...</p>`
})



//If a campground is deleted, all of the reviews for it should be removed as well else they will be inaccessible to us
campgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews //delete every review document from the reviews array within the deleted campground
            }
        })
    }
})



module.exports = mongoose.model('Campground', campgroundSchema)

