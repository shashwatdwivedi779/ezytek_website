const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    userName: {
        type: String,
        required: [true, 'User Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },

    city: {
        type: String,
        trim: true
    },

    password: {
        type: String,
        required: [true, 'Password is required']
    },

    role: {
        type: String,
        enum: ['Admin', 'Customer'],
        default: 'Customer'
    },

    card: [{
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'Product'
    }],

    brought: [{
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'Product'
    }]

}, { timestamps: true });

module.exports = mongoose.model('user_data', userSchema);