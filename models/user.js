//Using passport (passportjs.org), a node library, for the authentication in this app
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'userName'
}); //adds on to the Schema a username and password

module.exports = mongoose.model('User', UserSchema);