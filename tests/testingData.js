const Campground = require('../models/campground');
const User = require('../models/user');
const cities = require('../seeds/cities');

module.exports.createTestUser = async (email, username) => {
    const newUser = new User({
        email: email,
        userName: username
    });

    const registeredUser = await User.register(newUser, 'password123');
    return registeredUser;
};


module.exports.createTestCampground = async (user) => {
    const campground = new Campground({
        title: 'Test Campground',
        location: 'Test Location',
        description: 'A campground used for testing',
        price: 20,
        author: user._id,
        geometry: {
            type: "Point",
            coordinates: [
                -79.3832,
                43.6532
            ]
        },
        images: [
            {
                url: 'https://example.com/test.jpg',
                filename: 'test'
            }
        ]
    });

    await campground.save();

    return campground;
};


module.exports.populateCampgrounds = async (user) => {
    
    let campgrounds= [];
    // create at least one campground and up to 20 then return them for validation
    for (let i = 0; i < (Math.floor(Math.random() * 20) + 1); i++ ) {
        const random1000 = Math.floor(Math.random() * 1000);
        const campground = new Campground({
            title: 'Test Campground ' + (i + 1),
            location: 'Test Location ' + (i + 1),
            description: 'A campground used for testing',
            price : Math.floor(Math.random() * 30) + 10,
            author: user._id,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                    url: 'https://example.com/test.jpg',
                    filename: 'test'
                }
            ]
        });

        await campground.save();
        campgrounds.push(campground);
    }
    

    return campgrounds;
};

// used to test exact amounts of campgrounds for pagination
module.exports.seedCampgrounds = async (user, count) => {
    const campgrounds = [];
    for (let i = 0; i < count; i++) {
        campgrounds.push(await module.exports.createTestCampground(user));
    }
    return campgrounds;
};