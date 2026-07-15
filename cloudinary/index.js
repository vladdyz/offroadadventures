//Images for campgrounds in the database are stored on the Cloudinary server
//They can be uploaded by the client when submitting a new campground, using Multer support for Cloudinary to parse multiform data
//The database will store URLs to these images, and Multer will also parse the storage in Cloudinary to render the images


const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary, 
    params: {
        folder: 'CampgroundsApp',
        allowedFormats: ['jpeg', 'png', 'jpg', 'bmp']
    }
});

module.exports = { cloudinary, storage };
