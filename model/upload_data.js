const mongoose = require('mongoose');

// Define the Technical Specification Sub-Schema
const techSpecSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Technical specification key is required'],
        trim: true,
        maxlength: [100, 'Technical key cannot exceed 100 characters']
    },
    value: {
        type: String,
        required: [true, 'Technical specification value is required'],
        trim: true,
        maxlength: [200, 'Technical value cannot exceed 200 characters']
    }
}, { _id: false }); // Prevents mongoose from creating an _id for each array item

// Define the Main Product Schema
const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [3, 'Product name must be at least 3 characters long'],
        maxlength: [150, 'Product name cannot exceed 150 characters'],
        index: true // Helps with search performance
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: [
                'Automatic Car Washer',
                'High Pressure Washer',
                'Plunger Pump',
                'Dry Cleaner & Vacuum Cleaner',
                'Underbody & Top Wash Cleaner',
                'Heavy Vehicle Washing Plant',
                'Steam Cleaner',
                'ABC Setup',
                'Accessories'
            ],
            message: '{VALUE} is not a valid category'
        },
        index: true
    },
    price: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    finalPrice: {
        type: Number,
        required: [true, 'Final price is required'],
        min: [0, 'Final price cannot be negative']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    specifications: {
        type: String,
        required: [true, 'Product Specifications is required'],
        trim: true,
        minlength: [10, 'Specifications must be at least 10 characters long'],
        maxlength: [200, 'Specifications cannot exceed 200 characters']
    },
    technical_specification: {
        type: [techSpecSchema],
        validate: [arrayLimit, 'You can add a maximum of 20 technical specifications'],
        required: [true, 'Product should be atleast 1 specification']
    },
    main_image: {
        type: String,
        required: [true, 'Main Image Must Be Required']
},
    images: {
        type: [String],
        default: [],
        validate: [imageLimit, 'You must upload 1 to 10 product images']
    },
    isActive: {
        type: Boolean,
        default: true // Allows you to hide products without deleting them
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Custom Validator for Specifications Array
function arrayLimit(val) {
    return val.length <= 20;
}

// Custom Validator for Images Array
function imageLimit(val) {
    return val.length > 0 && val.length <= 10;
}

// Pre-save hook to ensure finalPrice calculation is correct on the server side
productSchema.pre('save', function() {
    const calculatedFinal = this.price - (
        this.price * (this.discount / 100)
    );
    this.finalPrice = Math.max(
        0,
        Number(calculatedFinal.toFixed(0))
    );
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;