
const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({

    // Customer who requested the quote
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_data',
        required: true,
        index: true
    },

    // Product information
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    productName: {
        type: String,
        required: true,
        trim: true
    },

    // Price information
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },

    // Customer information
    companyName: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },

    message: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },

    // Admin management
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },

    adminNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Quote', quoteSchema);
