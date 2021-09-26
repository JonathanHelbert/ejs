const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    user_fname: {
        type: String,
        required: true
    },
    user_lname: {
        type: String,
        required: true
    },
    birthdate: {
        type: Date,
        required: true
    },
    contact_number: {
        type: String,
        required: true
    },
    permanent_address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        required: true
    },
    // Lawyer Related Fields
    affiliation: {
        type: String,
    },
    is_available: {
        type: Boolean,
    },
    // Hide information
    is_public: {
        type: Boolean,
    },
    complaints: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Complaint"
    }],
    date_created: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('User', UserSchema)