//Run this file separately from the app anytime you want to seed the database with random park data
const mongoose = require('mongoose')
const express = require('express');
const app = express();
const path = require('path');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Campground = require('../models/campground');
require('dotenv').config();

// Now connects to Mongo instead of a local server


/*
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    //useCreateIndex: true, 
    useUnifiedTopology: true
})
*/
mongoose.connect(process.env.MONGO);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=> {
    console.log("Database connected")
});


const sample = (array) => array [Math.floor(Math.random() * array.length)]; //random index picker function for below, accepts an array and picks a random element from it

const seedDB = async() => {
    await Campground.deleteMany({}); //clear the database first
    //testing
    //const c = new Campground({title: 'purple field'})
    //await c.save();
    for(let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        //Pick a random city out of the 1000 cities in cities.js and a random name using the descriptors from the arrays in seedHelper
        const price = Math.floor(Math.random() * 30) + 10
        const camp = new Campground({
            author: '6a58625a642bae3f87343d32', //each campground references a unique obhectId as its author, the initial db is populated by campgrounds with my own user id. Locally this would be '669ec03ddc6d1b1704620d3a' instead
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                {
                    url: `https://picsum.photos/400?random=${Math.random()}`,
                    filename: "temp",
                },
                {
                    url: `https://picsum.photos/400?random=${Math.random()}`,
                    filename: "temp",
                },
            ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            } 
        })
        await camp.save();
    }
}

seedDB().then(()=> {
    mongoose.connection.close();
})