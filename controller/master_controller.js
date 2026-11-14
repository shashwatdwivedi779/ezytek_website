const mongoose = require('mongoose');
const Product = require('../model/upload_data');
const WorkProof = require('../model/work_proof');
const Quote = require('../model/quote');
const user_data = require('../model/user_data');

exports.GetUpload = (req, res) => {
    res.render('upload_products', { errorMessages: [], oldInput: {} });
};

exports.GetMaster = (req, res) => {
    res.render('after_login');
};

exports.PostUpload = async (req, res, next) => {
    const body = req.body || {};

    // Safely extract specifications (supports both techKeys and techKeys[])
    const rawKeys = body.techKeys || body['techKeys[]'] || [];
    const rawVals = body.techValues || body['techValues[]'] || [];
    const keysArr = Array.isArray(rawKeys) ? rawKeys : [rawKeys];
    const valsArr = Array.isArray(rawVals) ? rawVals : [rawVals];

    // Safely extract image URLs (new S3 upload or retained)
    let main_image = null;
    if (req.files?.main_image?.length > 0) {
        const file = req.files.main_image[0];
        main_image = file.location || file.key || file.filename || null;
    } else if (body.existing_main_image) {
        main_image = Array.isArray(body.existing_main_image) ? body.existing_main_image[0] : body.existing_main_image;
    }

    let images = [];
    if (req.files?.images?.length > 0) {
        images = req.files.images.map(file => file.location || file.key || file.filename).filter(Boolean);
    }
    if (images.length === 0 && body.existing_images) {
        images = Array.isArray(body.existing_images) ? body.existing_images : [body.existing_images];
    }

    try {
        // Build specifications array
        const technical_specification = keysArr
            .map((k, i) => ({ key: String(k || '').trim(), value: String(valsArr[i] || '').trim() }))
            .filter(s => s.key || s.value);

        // Save new product
        const product = new Product({
            productName: body.productName,
            category: body.category,
            price: Number(body.price),
            discount: body.discount ? Number(body.discount) : 0,
            finalPrice: Number(body.finalPrice),
            description: body.description,
            specifications : body.specifications,
            technical_specification,
            images,
            main_image
        });

        await product.save();
        console.log("Successfully Uploaded Product");
        return res.redirect('/master');

    } catch (err) {

        const errorMessages = err.name === 'ValidationError'
            ? Object.values(err.errors).map(e => e.message)
            : [err.message || 'Failed to upload product. Please check your inputs.'];

        return res.status(400).render('upload_products', {
            errorMessages,
            oldInput: {
                productName: body.productName || '',
                category: body.category || '',
                price: body.price !== undefined ? body.price : '',
                discount: body.discount !== undefined ? body.discount : '',
                finalPrice: body.finalPrice !== undefined ? body.finalPrice : '',
                description: body.description || '',
                specifications: body.specifications || '',
                keysArr,
                valsArr,
                existing_main_image: main_image,
                existing_images: images
            }
        });
    }
};


exports.AdminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');

        if (!email || !password) {
            const msg = "Please enter both email and password.";
            return isJson ? res.status(400).json({ success: false, message: msg }) : res.render('login', { error: msg });
        }

        const normalizedEmail = email.trim().toLowerCase() ;

        if(!normalizedEmail === process.env.MASTER_ID){
            const msg = "No account found with this email address.";
            return isJson ? res.status(400).json({ success: false, message: msg }) : res.render('login', { error: msg });
        }

        if (!password === process.env.MASTER_PASS) {
            const msg = "Incorrect password. Please try again.";
            return isJson ? res.status(400).json({ success: false, message: msg }) : res.render('login', { error: msg });
        }

        // Password matches! Issue JWT cookie
        const jwtSecret = process.env.JWT_SECRET_KEY || "ezytek_default_jwt_secret";
        const token = jwt.sign(
            { userId: user._id },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return isJson ? res.status(200).json({ success: true, redirectUrl: "/" }) : res.redirect('/');

    } catch (error) {
        console.error("Error in PostLogin:", error);
        const msg = "An error occurred during sign in. Please try again.";
        return req.xhr ? res.status(500).json({ success: false, message: msg }) : res.render('login', { error: msg });
    }
};






exports.UpdateProduct = async (req, res) => {};

// ─── GET: Show update form pre-filled ───────────────────────────────────────
exports.GetUpdateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('errors', { errorMessages: ['Product not found'] });
        }
        return res.render('upload_products', {
            errorMessages: [],
            oldInput: {
                _id: product._id,
                productName: product.productName,
                category: product.category,
                price: product.price,
                discount: product.discount,
                finalPrice: product.finalPrice,
                description: product.description,
                specifications: product.specifications,
                keysArr: (product.technical_specification || []).map(s => s.key),
                valsArr: (product.technical_specification || []).map(s => s.value),
                existing_main_image: product.main_image,
                existing_images: product.images || [],
                isUpdate: true
            }
        });
    } catch (err) { next(err); }
};

// ─── POST: Save updated product ──────────────────────────────────────────────
exports.PostUpdateProduct = async (req, res, next) => {
    const body = req.body || {};
    const rawKeys = body.techKeys || body['techKeys[]'] || [];
    const rawVals = body.techValues || body['techValues[]'] || [];
    const keysArr = Array.isArray(rawKeys) ? rawKeys : [rawKeys];
    const valsArr = Array.isArray(rawVals) ? rawVals : [rawVals];

    let main_image = body.existing_main_image || null;
    if (Array.isArray(main_image)) main_image = main_image[0];
    if (req.files?.main_image?.length > 0) {
        const file = req.files.main_image[0];
        main_image = file.location || file.key || file.filename || null;
    }

    let images = [];
    if (req.files?.images?.length > 0) {
        images = req.files.images.map(f => f.location || f.key || f.filename).filter(Boolean);
    }
    if (images.length === 0 && body.existing_images) {
        images = Array.isArray(body.existing_images) ? body.existing_images : [body.existing_images];
    }

    try {
        const technical_specification = keysArr
            .map((k, i) => ({ key: String(k || '').trim(), value: String(valsArr[i] || '').trim() }))
            .filter(s => s.key || s.value);

        await Product.findByIdAndUpdate(
            req.params.id,
            {
                productName: body.productName,
                category: body.category,
                price: Number(body.price),
                discount: body.discount ? Number(body.discount) : 0,
                finalPrice: Number(body.finalPrice),
                description: body.description,
                specifications: body.specifications,
                technical_specification,
                main_image,
                images
            },
            { returnDocument: 'after', runValidators: true }
        );

        return res.redirect('/products/' + req.params.id);
    } catch (err) {
        const errorMessages = err.name === 'ValidationError'
            ? Object.values(err.errors).map(e => e.message)
            : [err.message || 'Failed to update product.'];

        return res.status(400).render('upload_products', {
            errorMessages,
            oldInput: {
                _id: req.params.id,
                productName: body.productName || '',
                category: body.category || '',
                price: body.price || '',
                discount: body.discount || '',
                finalPrice: body.finalPrice || '',
                description: body.description || '',
                specifications: body.specifications || '',
                keysArr,
                valsArr,
                existing_main_image: main_image,
                existing_images: images,
                isUpdate: true
            }
        });
    }
};

// ─── WorkProof: Admin add work proof ────────────────────────────────────────
exports.GetAddWorkProof = async (req, res, next) => {
    try {
        const proofs = await WorkProof.find().sort({ createdAt: -1 });
        return res.render('add_workproof', { errorMessages: [], proofs });
    } catch (err) { next(err); }
};

exports.PostWorkProof = async (req, res, next) => {
    try {
        const { youtubeUrl, title, description } = req.body;
        if (!youtubeUrl || !title) {
            const proofs = await WorkProof.find().sort({ createdAt: -1 });
            return res.status(400).render('add_workproof', {
                errorMessages: ['YouTube URL and Title are required.'],
                proofs
            });
        }
        await WorkProof.create({
            youtubeUrl: youtubeUrl.trim(),
            title: title.trim(),
            description: (description || '').trim()
        });
        return res.redirect('/master/workproof');
    } catch (err) { next(err); }
};

exports.DeleteWorkProof = async (req, res, next) => {
    try {
        await WorkProof.findByIdAndDelete(req.params.id);
        return res.redirect('/master/workproof');
    } catch (err) { next(err); }
};


exports.GetCostomer = async (req, res, next) => {
    try {
        const customers = await user_data.find({ role: 'Customer' }).select('-password').sort({ createdAt: -1 });
        return res.render('after_login', { customers });
    } catch (err) { next(err); }
};

// ============================================================
// ─── ADMIN QUOTE MANAGEMENT ─────────────────────────────────
// ============================================================

// ─── 1. GET: List All Quotes with Filters, Stats & Search ───
exports.GetAllQuotes = async (req, res, next) => {
    try {
        const { status, search } = req.query;

        // Build dynamic query
        let query = {};
        if (status && status !== 'all' && ['Pending', 'Contacted', 'Approved', 'Rejected', 'Completed'].includes(status)) {
            query.status = status;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { productName: searchRegex },
                { companyName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Fetch populated quotes list
        const quotes = await Quote.find(query)
            .populate('user', 'userName email city phone role')
            .populate('product', 'productName category price discount finalPrice main_image specifications')
            .sort({ createdAt: -1 });

        // Calculate overarching statistics across all quotes
        const allQuotes = await Quote.find().select('status totalPrice');
        const stats = {
            totalQuotes: allQuotes.length,
            pending: allQuotes.filter(q => q.status === 'Pending').length,
            contacted: allQuotes.filter(q => q.status === 'Contacted').length,
            approved: allQuotes.filter(q => q.status === 'Approved').length,
            rejected: allQuotes.filter(q => q.status === 'Rejected').length,
            completed: allQuotes.filter(q => q.status === 'Completed').length,
            totalValue: allQuotes.reduce((acc, q) => acc + (q.totalPrice || 0), 0),
            approvedValue: allQuotes.filter(q => q.status === 'Approved').reduce((acc, q) => acc + (q.totalPrice || 0), 0)
        };

        const successMessage = req.query.success || null;
        const errorMessage = req.query.error || null;

        return res.render('admin_quotes', {
            quotes,
            stats,
            currentStatus: status || 'all',
            searchQuery: search || '',
            successMessage,
            errorMessage,
            user: res.locals.user || { role: 'Admin', userName: 'Admin' }
        });
    } catch (err) {
        console.error('Error in GetAllQuotes:', err);
        next(err);
    }
};

// ─── 2. GET: Single Quote Analysis & Management View ────────
exports.GetQuoteDetails = async (req, res, next) => {
    try {
        const quoteId = req.params.id;
        if (!quoteId || !mongoose.Types.ObjectId.isValid(quoteId)) {
            return res.status(404).render('errors', { errorMessages: ['Invalid Quote Reference ID.'] });
        }

        const quote = await Quote.findById(quoteId)
            .populate('user', 'userName email city phone role createdAt')
            .populate('product', 'productName category price discount finalPrice main_image images specifications technical_specification description');

        if (!quote) {
            return res.status(404).render('errors', { errorMessages: ['The requested Quote was not found in our records.'] });
        }

        const successMessage = req.query.success || null;
        const errorMessage = req.query.error || null;

        return res.render('quote_details', {
            quote,
            successMessage,
            errorMessage,
            user: res.locals.user || { role: 'Admin', userName: 'Admin' }
        });
    } catch (err) {
        console.error('Error in GetQuoteDetails:', err);
        next(err);
    }
};

// ─── 3. POST: Update Quote Status (Accept, Reject, etc.) ────
exports.PostUpdateQuoteStatus = async (req, res, next) => {
    try {
        const quoteId = req.params.id;
        const { status, adminNotes } = req.body;
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');

        if (!quoteId || !mongoose.Types.ObjectId.isValid(quoteId)) {
            const msg = 'Invalid Quote Reference ID.';
            return isJson 
                ? res.status(400).json({ success: false, message: msg }) 
                : res.redirect(`/master/quotes?error=${encodeURIComponent(msg)}`);
        }

        const validStatuses = ['Pending', 'Contacted', 'Approved', 'Rejected', 'Completed'];
        if (!validStatuses.includes(status)) {
            const msg = `Invalid status provided. Allowed options: ${validStatuses.join(', ')}`;
            return isJson 
                ? res.status(400).json({ success: false, message: msg }) 
                : res.redirect(`/master/quotes/${quoteId}?error=${encodeURIComponent(msg)}`);
        }

        const updateData = { status };
        if (typeof adminNotes !== 'undefined') {
            updateData.adminNotes = String(adminNotes).trim();
        }

        const updatedQuote = await Quote.findByIdAndUpdate(
            quoteId,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedQuote) {
            const msg = 'Quote not found in database.';
            return isJson 
                ? res.status(404).json({ success: false, message: msg }) 
                : res.redirect(`/master/quotes?error=${encodeURIComponent(msg)}`);
        }

        const successMsg = `Quote #${quoteId.slice(-6).toUpperCase()} status successfully updated to "${status}".`;
        if (isJson) {
            return res.status(200).json({
                success: true,
                message: successMsg,
                quote: updatedQuote
            });
        }

        return res.redirect(`/master/quotes/${quoteId}?success=${encodeURIComponent(successMsg)}`);
    } catch (err) {
        console.error('Error in PostUpdateQuoteStatus:', err);
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');
        if (isJson) {
            return res.status(500).json({ success: false, message: err.message || 'Failed to update quote status.' });
        }
        next(err);
    }
};

// ─── 4. POST: Delete Quote Record ───────────────────────────
exports.DeleteQuote = async (req, res, next) => {
    try {
        const quoteId = req.params.id;
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');

        if (!quoteId || !mongoose.Types.ObjectId.isValid(quoteId)) {
            const msg = 'Invalid Quote Reference ID.';
            return isJson 
                ? res.status(400).json({ success: false, message: msg }) 
                : res.redirect(`/master/quotes?error=${encodeURIComponent(msg)}`);
        }

        const deleted = await Quote.findByIdAndDelete(quoteId);
        if (!deleted) {
            const msg = 'Quote not found or already removed.';
            return isJson 
                ? res.status(404).json({ success: false, message: msg }) 
                : res.redirect(`/master/quotes?error=${encodeURIComponent(msg)}`);
        }

        const successMsg = `Quote #${quoteId.slice(-6).toUpperCase()} was permanently removed.`;
        if (isJson) {
            return res.status(200).json({ success: true, message: successMsg });
        }

        return res.redirect(`/master/quotes?success=${encodeURIComponent(successMsg)}`);
    } catch (err) {
        console.error('Error in DeleteQuote:', err);
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');
        if (isJson) {
            return res.status(500).json({ success: false, message: err.message || 'Failed to delete quote.' });
        }
        next(err);
    }
};