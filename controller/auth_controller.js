const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../model/user_data');
const otp_data = require('../model/otp_user');
const { generateOTP, hashOTP, sendOTP, verifyOTP } = require('../services/otp_service');

exports.GetLogin = (req, res) => {
    res.render('login');
};

exports.sendOtp = async (req, res, next) => {
    try {
        if (!req.body || !req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required."
            });
        }

        const email = req.body.email.trim().toLowerCase();

        // Check if an account with this email already exists
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists. Please Sign In."
            });
        }

        const otp = generateOTP();
        const hashOtp = hashOTP(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

        // Remove previous OTPs for this email
        await otp_data.deleteMany({ email });

        // Save new OTP record
        await otp_data.create({
            email,
            hashOtp,
            expiresAt
        });

        // Send OTP via Email
        await sendOTP(email, otp);

        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${email}`
        });

    } catch (error) {
        console.error("Error in sendOtp:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to send verification OTP. Please try again."
        });
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        const userOtp = await otp_data.findOne({
            email: email.trim().toLowerCase()
        });

        if (!userOtp) {
            return res.status(400).json({
                success: false,
                message: "No active verification request found. Please request a new OTP."
            });
        }

        // Expiry check
        if (userOtp.expiresAt <= new Date()) {
            await otp_data.findByIdAndDelete(userOtp._id);
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new code."
            });
        }

        // Attempts check
        if (userOtp.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many failed attempts. Please request a new OTP."
            });
        }

        // OTP format validation
        if (!/^\d{6}$/.test(String(otp).trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP."
            });
        }

        // Compare OTP
        if (!verifyOTP(String(otp).trim(), userOtp.hashOtp)) {
            userOtp.attempts += 1;
            await userOtp.save();
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please check and try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully."
        });

    } catch (error) {
        console.error("Error in verifyOtp:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during verification."
        });
    }
};

exports.PostSignup = async (req, res, next) => {
    try {
        const { userName, email, city, password, otp } = req.body;

        if (!userName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields (Name, Email, Password)."
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Email verification OTP is required to complete registration."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await Users.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists. Please Sign In."
            });
        }

        // Verify OTP from database
        const userOtp = await otp_data.findOne({ email: normalizedEmail });
        if (!userOtp) {
            return res.status(400).json({
                success: false,
                message: "Verification code expired or not found. Please request a new OTP."
            });
        }

        if (userOtp.expiresAt <= new Date()) {
            await otp_data.findByIdAndDelete(userOtp._id);
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new code."
            });
        }

        if (userOtp.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many failed attempts. Please request a new OTP."
            });
        }

        if (!verifyOTP(String(otp).trim(), userOtp.hashOtp)) {
            userOtp.attempts += 1;
            await userOtp.save();
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP code. Please enter the valid code sent to your email."
            });
        }

        // OTP is valid! Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Users.create({
            userName: userName.trim(),
            email: normalizedEmail,
            city: city ? city.trim() : "",
            password: hashedPassword
        });

        // Delete OTP after successful creation
        await otp_data.deleteMany({ email: normalizedEmail });

        // Generate JWT token & set cookie
        const jwtSecret = process.env.JWT_SECRET_KEY || "ezytek_default_jwt_secret";
        const token = jwt.sign(
            { userId: newUser._id },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully! Redirecting...",
            redirectUrl: "/"
        });

    } catch (error) {
        console.error("Error in PostSignup:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create account. Please try again."
        });
    }
};

exports.PostLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const isJson = req.xhr || req.headers['content-type']?.includes('application/json');

        if (!email || !password) {
            const msg = "Please enter both email and password.";
            return isJson ? res.status(400).json({ success: false, message: msg }) : res.render('login', { error: msg });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await Users.findOne({ email: normalizedEmail });

        if (!user) {
            const msg = "No account found with this email address.";
            return isJson ? res.status(400).json({ success: false, message: msg }) : res.render('login', { error: msg });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
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

        // AJAX request → return JSON with redirect URL
        if (isJson) {
            return res.status(200).json({ success: true, message: "Login successful!", redirectUrl: '/user' });
        }
        return res.redirect('/user');

    } catch (error) {
        console.error("Error in PostLogin:", error);
        const msg = "An error occurred during sign in. Please try again.";
        if (req.xhr || req.headers['content-type']?.includes('application/json')) {
            return res.status(500).json({ success: false, message: msg });
        }
        return res.render('login', { error: msg });
    }
};

exports.GetLogout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

// ==================== CHANGE PASSWORD ====================

exports.GetChangePassword = async (req, res, next) => {
    try {
        const user = res.locals.user;
        if (!user) {
            return res.redirect('/login');
        }
        return res.render('change_pass', {
            user,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('Error in GetChangePassword:', err);
        next(err);
    }
};

exports.PostChangePassword = async (req, res, next) => {
    try {
        const isJson = req.xhr || 
                       req.headers['content-type']?.includes('application/json') || 
                       req.headers.accept?.includes('application/json');
        
        const user = res.locals.user;
        if (!user || !req.userId) {
            if (isJson) {
                return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
            }
            return res.redirect('/login');
        }

        const { currentPassword, newPassword, confirmPassword } = req.body || {};

        const returnError = (message) => {
            if (isJson) {
                return res.status(400).json({ success: false, message });
            }
            return res.render('change_pass', {
                user,
                error: message,
                success: null
            });
        };

        // 1. Check required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return returnError('All password fields are required.');
        }

        const trimmedCurrent = String(currentPassword).trim();
        const trimmedNew = String(newPassword).trim();
        const trimmedConfirm = String(confirmPassword).trim();

        // 2. Minimum length check
        if (trimmedNew.length < 6) {
            return returnError('New password must be at least 6 characters long.');
        }

        // 3. Confirm password matching
        if (trimmedNew !== trimmedConfirm) {
            return returnError('New password and confirmation password do not match.');
        }

        // 4. Disallow reusing identical password
        if (trimmedCurrent === trimmedNew) {
            return returnError('New password must be different from your current password.');
        }

        // 5. Fetch fresh user record from DB
        const dbUser = await Users.findById(req.userId);
        if (!dbUser) {
            return returnError('User account not found. Please log in again.');
        }

        // 6. Verify existing current password
        const isMatch = await bcrypt.compare(trimmedCurrent, dbUser.password);
        if (!isMatch) {
            return returnError('Incorrect current password. Please re-enter your current password.');
        }

        // 7. Hash new password and save
        const hashedPassword = await bcrypt.hash(trimmedNew, 10);
        dbUser.password = hashedPassword;
        await dbUser.save();

        const successMessage = 'Your password has been changed successfully!';

        if (isJson) {
            return res.status(200).json({
                success: true,
                message: successMessage
            });
        }

        return res.render('change_pass', {
            user: dbUser,
            error: null,
            success: successMessage
        });

    } catch (err) {
        console.error('Error in PostChangePassword:', err);
        const errMessage = 'An error occurred while updating your password. Please try again.';
        if (req.xhr || req.headers['content-type']?.includes('application/json')) {
            return res.status(500).json({ success: false, message: errMessage });
        }
        return res.render('change_pass', {
            user: res.locals.user,
            error: errMessage,
            success: null
        });
    }
};




