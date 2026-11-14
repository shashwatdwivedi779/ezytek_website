const express = require('express');
const home = express.Router();

const HomeController = require('../controller/home_cotroller');
const AuthController = require('../controller/auth_controller');
const MasterController = require('../controller/master_controller');

const upload = require('../services/multer');
const { security, adminOnly } = require('../services/auth');


// ==================== PUBLIC ROUTES ====================

home.get('/', HomeController.GetHome);

home.get('/login', AuthController.GetLogin);
home.post('/login', AuthController.PostLogin);

home.post('/send-otp', AuthController.sendOtp);
home.post('/verify-otp', AuthController.verifyOtp);
home.post('/signup', AuthController.PostSignup);

home.get('/workproof', HomeController.GetWorkProofs);

home.get('/products', HomeController.GetAllProducts);
home.get('/products/setup', HomeController.GetSetup);
home.get('/products/:id', HomeController.GetDetails);
home.get('/contact', (req, res) => res.redirect('/#contact'));


// ==================== AUTHENTICATION ROUTES ====================

home.get('/logout', security, AuthController.GetLogout);


// ==================== ADMIN ROUTES ====================

// Master Dashboard
home.get('/master', adminOnly, MasterController.GetMaster);

// Product Upload
home.get('/master/upload', adminOnly, MasterController.GetUpload);

home.post('/master/upload', adminOnly,
    upload.fields([
        { name: 'main_image', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    MasterController.PostUpload
);

// Product Update
home.get('/master/update/:id', adminOnly,
    MasterController.GetUpdateProduct
);

home.post('/master/update/:id', adminOnly,
    upload.fields([
        { name: 'main_image', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    MasterController.PostUpdateProduct
);

// WorkProof Management
home.get('/master/workproof', adminOnly,
    MasterController.GetAddWorkProof
);

home.post('/master/workproof', adminOnly,
    MasterController.PostWorkProof
);

home.post('/master/workproof/delete/:id', adminOnly,
    MasterController.DeleteWorkProof
);

// Admin Products
home.get('/master/products', adminOnly,
    HomeController.GetAllProducts
);

home.get('/master/costomer_data', adminOnly, 
    MasterController.GetCostomer 
);

// Admin Quote Management
home.get('/master/quotes', adminOnly,
    MasterController.GetAllQuotes
);

home.get('/master/quotes/:id', adminOnly,
    MasterController.GetQuoteDetails
);

home.post('/master/quotes/status/:id', adminOnly,
    MasterController.PostUpdateQuoteStatus
);

home.post('/master/quotes/delete/:id', adminOnly,
    MasterController.DeleteQuote
);


// ==================== CUSTOMER / USER ROUTES ====================

// User Dashboard
home.get('/user', security, HomeController.GetUser);

// Change Password (Customer & Admin authenticated users)
home.get('/user/change_pass', security, AuthController.GetChangePassword);
home.post('/user/change_pass', security, AuthController.PostChangePassword);

// Customer Quotes
home.get('/costomer/quote/:id', security,
    HomeController.GetQuote
);

home.get('/costomer/quote', security,
    HomeController.GetQuotes
);

home.get('/costomer/quotes', security,
    HomeController.GetQuotes
);

home.post('/costomer/quote', security,
    HomeController.PostQuote
);

// Shopping Cart
home.get('/user/card', security,
    HomeController.GetCard
);

home.get('/user/card/:id', security,
    HomeController.PostCard
);

home.post('/user/delete_cart/:id', security,
    HomeController.DeleteCart
);

// Orders & Quotes
home.get('/user/orders', security,
    HomeController.GetOrders
);

home.get('/user/quotes', security,
    HomeController.GetQuotes
);


module.exports = home;