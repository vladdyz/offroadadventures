//While this app is still in development, require the dotenv package to access the private environmental variables
//In production (when this app is deployed) this will be unneccessary as these are stored elsewhere
if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const mongoose = require('mongoose');
const dbUrl = process.env.MONGO;

const port = process.env.PORT || 3080

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

const app = require('./index');


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
