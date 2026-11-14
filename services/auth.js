const jwt = require('jsonwebtoken') ;
const Users = require('../model/user_data') ;

const auth = (req, res, next) => {
    req.isLoggedIn = false ;
    req.userId = null ;
    res.locals.isLoggedIn = false ;

    const token = req.cookies?.token;
    if(!token) {
        return next() ;
    }

    try {
        const decoded = jwt.verify(
            token, process.env.JWT_SECRET_KEY
        ) ;
        req.userId = decoded.userId ;
        req.isLoggedIn = true;
        res.locals.isLoggedIn = true;

    } catch (err) {
        req.isLoggedIn = false;
        req.userId = null;
        res.locals.isLoggedIn = false;
    }

    next () ;
}


const userMiddleware = async (req, res, next) => {
        if (!req.userId) {
        res.locals.user = null;
        return next();
    }
    try {
        const user = await Users.findById(req.userId);
        res.locals.user = user;
    } catch (err) {
        res.locals.user = null;
    }
    next();
}

const security = (req, res, next) => {
    if (req.isLoggedIn && res.locals.user) {
        return next();
    }

    return res.redirect('/login');
};




const adminOnly = (req, res, next) => {

    if (!req.isLoggedIn || !res.locals.user) {
        return res.redirect('/login');
    }

    if (res.locals.user.role !== 'Admin') {
        return res.status(403).send('Access Denied: Admin Only');
    }

    return next();
};

module.exports = { auth, userMiddleware, security, adminOnly } ;