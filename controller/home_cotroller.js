const mongoose = require('mongoose');
const Product = require('../model/upload_data');
const Quote = require('../model/quote');
const user_data = require('../model/user_data');
const WorkProof = require('../model/work_proof');

async function returnData(category) {
    return await Product.find({
        category: category
    });
}

 const categories = [
            'Automatic Car Washer',
            'High Pressure Washer',
            'Plunger Pump',
            'Dry Cleaner & Vacuum Cleaner',
            'Underbody & Top Wash Cleaner',
            'Heavy Vehicle Washing Plant',
            'Steam Cleaner',
            'ABC Setup',
            'Accessories'
        ];

exports.GetHome = async (req, res) => {
    try {
        const data = await Promise.all(
            categories.map(category => returnData(category))
        );

        res.render('new_home', {
            title: 'Ezytek Clean Pvt. Ltd. | Industrial Cleaning Equipment & Washing Plants',
            description: 'Ezytek Clean is a leading manufacturer of automatic car wash plants, high pressure washers, industrial washing systems, floor scrubbers and industrial cleaning equipment in India.',
            data
        });

    } catch (err) {
        console.error('Error Fetching Products:', err);
        res.status(500).send('Internal Server Error');
    }
};

exports.GetDetails = async (req, res) => {
    try {
        const product_id = req.params.id;

        // Guard against non-ObjectId values (like image filenames, static file requests, or invalid slugs)
        if (!mongoose.Types.ObjectId.isValid(product_id)) {
            return res.status(404).render('errors', { errorMessages: ['Invalid product ID or product not found.'] });
        }

        const de_product = await Product.findById(product_id);
        if (!de_product) {
            return res.status(404).render('errors', { errorMessages: ['Product not found.'] });
        }

        const all_products = await returnData(de_product.category);
        res.render('details', { product: de_product, category: all_products });
    } catch (err) {
        console.error('Error in GetDetails:', err);
        res.status(500).render('errors', { errorMessages: ['Internal Server Error'] });
    }
};

exports.GetUser = async (req, res, next) => {
    try {
        if (!req.isLoggedIn || !res.locals.user) return res.redirect('/login');

        const user = res.locals.user;
        let stats = null;

        if (user.role === 'Admin') {
            const [totalProducts, totalCustomers, totalOrders] = await Promise.all([
                Product.countDocuments(),
                user_data.countDocuments({ role: 'Customer' }),
                Quote.countDocuments()
            ]);
            stats = { totalProducts, totalCustomers, totalOrders };
        }

        return res.render('after_login', { stats });
    } catch (err) { next(err); }
};

exports.GetAllProducts = async (req, res) => {
    try {
        const categoryFilter = req.query.category;
        const query = (categoryFilter && categoryFilter !== 'All') ? { category: categoryFilter } : {};
        const products = await Product.find(query).sort({ createdAt: -1 });
        
        res.render('all_products', {
            title: 'Industrial Equipment & Machinery Catalog | Ezytek Clean',
            products,
            selectedCategory: categoryFilter || 'All'
        });
    } catch (err) {
        console.error('Error in GetAllProducts:', err);
        res.status(500).render('errors', { errorMessages: ['Failed to load products. Please try again.'] });
    }
};


exports.GetQuote = async (req, res, next) => {
    try {
        const product_id = req.params.id;
        if (product_id) {
            if (!mongoose.Types.ObjectId.isValid(product_id)) {
                return res.status(404).render('errors', { errorMessages: ['Invalid product ID'] });
            }
            const products = await Product.findById(product_id);
            if (!products) {
                return res.status(404).render('errors', { errorMessages: ['Product not found'] });
            }
            return res.render('quote.ejs', { products });
        }

        // If accessed without an ID, show user's submitted quotes
        return exports.GetQuotes(req, res, next);
    } catch (err) {
        console.error('Error in GetQuote:', err);
        next(err);
    }
};


exports.PostQuote = async (req, res, next) => {

    try {

        const {
            productId,
            quantity,
            companyName,
            email,
            phone,
            message
        } = req.body;

        // 1. Validate Product ID
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send('Invalid Product ID');
        }

        // 2. Validate Quantity
        const qty = Number(quantity);

        if (!Number.isSafeInteger(qty) || qty < 1 || qty > 100000) {
            return res.status(400).send('Invalid Quantity');
        }

        // 3. Validate Email
        const customerEmail = String(email || '').trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const userData = await user_data.findById(req.userId) ;


        if (
            customerEmail.length > 254 ||
            !emailRegex.test(customerEmail)
        ) {
            return res.status(400).send('Invalid Email');
        }

        // 4. Validate Phone
        const customerPhone = String(phone || '').trim();

        if (
            !/^\+?[0-9\s()-]{7,20}$/.test(customerPhone)
        ) {
            return res.status(400).send('Invalid Phone Number');
        }

        // 5. Validate optional fields
        const company = String(companyName || '').trim();
        const customerMessage = String(message || '').trim();

        if (company.length > 100 || customerMessage.length > 1000) {
            return res.status(400).send('Input is too long');
        }

        // 6. Fetch actual product from database
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product Not Found');
        }

        // 7. Get actual price from database
        const unitPrice = Number(product.finalPrice);

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            return res.status(400).send('Invalid Product Price');
        }

        // 8. Calculate total price on server
        const totalPrice = Math.round(unitPrice * qty * 100) / 100;

        if (!Number.isSafeInteger(Math.round(totalPrice * 100))) {
            return res.status(400).send('Invalid Total Amount');
        }




        // 9. Save quote
        const newQuote = await Quote.create({

            user: req.userId,
            product: product._id,
            productName: product.productName,
            unitPrice,
            quantity: qty,
            totalPrice,
            companyName: company,
            email: customerEmail,
            phone: customerPhone,
            message: customerMessage

        });

// product ID ko save kiyaa user kw DB me 

if (!userData) {
    return res.status(404).send('User not found');
}
         userData.brought.push(productId) ;
         await userData.save()

        // 10. Success response
        return res.render('success', {
            reason: 'Quote Request Submitted',
            return_to: '/user/quotes'
        });

    } catch (error) {

        next(error);

    }

};


exports.GetCard = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.redirect('/login');
        }

        const userData = await user_data.findById(req.userId).populate('card');
        if (!userData) {
            return res.redirect('/login');
        }

        // Filter valid products (in case any were removed from database)
        const cards = Array.isArray(userData.card)
            ? userData.card.filter(item => item && typeof item === 'object')
            : [];

        // Count user's quote requests for the tab counter
        const quoteCount = await Quote.countDocuments({
            $or: [
                { user: req.userId },
                { email: userData.email }
            ]
        });

        return res.render('card_order', {
            cards,
            type: 'card',
            pageTitle: 'My Saved Machinery & Cart | Ezytek Clean',
            cartCount: cards.length,
            quoteCount
        });

    } catch (error) {
        console.error('Error in GetCard:', error);
        next(error);
    }
};

exports.PostCard = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.redirect('/login');
        }

        const productId = req.params.id ;

        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).redirect('/products');
        }

        const user = await user_data.findById(req.userId);
        if (!user) {
            return res.redirect('/login');
        }

        if (!Array.isArray(user.card)) {
            user.card = [];
        }

            const alreadyInCard = user.card.some(id => id.toString() === productId.toString());
            if (!alreadyInCard) {
                user.card.push(productId);
                await user.save();
            }

        return res.redirect('/user/card');

    } catch (error) {
        console.error('Error in PostCard:', error);
        next(error);
    }
};

exports.DeleteCart = async (req, res, next) => {
    const user = await user_data.findById(req.userId) ;
    const productId = req.params.id ;


// some ka use each element check karne me hota hai , agar present hai to true return karega 
    const isPresent = user.card.some(
    id => id.toString() === productId
);

if (!isPresent) {
    res.status(400).redirect('/user/card')
}

await user_data.findByIdAndUpdate(
    req.userId,
    {
        $pull: {
            card: productId
        }
    }
);

res.redirect('/user/card') ;

}

exports.GetQuotes = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.redirect('/login');
        }

        const user = await user_data.findById(req.userId);
        if (!user) {
            return res.redirect('/login');
        }

        // Fetch quotes requested by this user (by user ID or email)
        const quotes = await Quote.find({
            $or: [
                { user: req.userId },
                { email: user.email }
            ]
        })
        .populate('product')
        .sort({ createdAt: -1 });

        const cartCount = Array.isArray(user.card) ? user.card.length : 0;
        const quoteCount = quotes.length;

        return res.render('card_order', {
            quotes,
            type: 'quote',
            pageTitle: 'My Quotation Requests & Orders | Ezytek Clean',
            cartCount,
            quoteCount
        });

    } catch (error) {
        console.error('Error in GetQuotes:', error);
        next(error);
    }
};

exports.GetOrders = exports.GetQuotes;

exports.GetWorkProofs = async (req, res, next) => {
    try {
        const workProofs = await WorkProof.find({ isActive: true }).sort({ createdAt: -1 });
        return res.render('videos', { workProofs });
    } catch (err) { next(err); }
};

exports.GetSetup = (req, res) => {
    return res.render('setup', {
        pageTitle: 'Turnkey Car-Washing Setup — Coming Soon | Ezytek Clean',
        whatsappNumber: '9311313886'
    });
};


