//Joi SQL validator for our schemas, defining the type of the field and any necessary validators
//This is NOT the model itself (which is in the models folder)
const baseJoi = require('joi');
const sanitizeHtml = require('sanitize-html')

//This following part is to address any security concerns about potentially injecting scripts into the HTML (Cross-Site Scripting)\
//Ex: A user with authorization adds a new campground with <script>...</script> in its name, causing the site to execute the script.
//Define an extension on joi.string called 'escapeHTML' which has a validate function. Uses sanitizeHTML package which strips away any HTML tags in the input.
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!' //custom error message
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    //no tags or attributes are allowed
                    allowedTags: [],
                    allowedAttributes: {},
                });
                //compare the difference in the initial input and sanitized input, if there is a difference (meaning a tag was removed) then return an error message (the one above)
                if (clean !== value) return helpers.error('string.escapeHTML', { value });
                return clean;
            }
        }
    }
});

const Joi = baseJoi.extend(extension); //pass in the above extension into the default Joi
//Anytime we have text input make sure to pass in the escapeHTML extension to remove any potential script injection

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        //image: Joi.string().required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(),
        deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
});