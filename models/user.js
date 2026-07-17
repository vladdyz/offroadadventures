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
}); // the NoSQL database uses the camelCase spelling of this which the schema should reflect

module.exports = mongoose.model('User', UserSchema);