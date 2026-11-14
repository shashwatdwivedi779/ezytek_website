const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    hashOtp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    },

    attempts: {
        type: Number,
        default: 0
    }

});

module.exports = mongoose.model('otp_data', otpSchema);