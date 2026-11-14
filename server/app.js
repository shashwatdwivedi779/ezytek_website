const path = require('path');
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const express = require('express') ;
const app = express() ;
const mongoose = require('mongoose') ;
const UTILS = require('../utils/path') ;
const home = require('../router/home') ;
const CookieParser = require('cookie-parser') ;
const { auth, userMiddleware, security } = require('../services/auth') ;

const PORT = process.env.PORT
const DB_URL = process.env.DB

app.use( express.urlencoded({ extended: true })) ;
app.use( express.json() ) ;
app.use( express.static(path.join(UTILS, 'public'))) ;
app.use('/uploads', express.static(path.join(UTILS, 'uploads'))) ;
app.use('/uploads', express.static(path.join(UTILS, 'public', 'uploads'))) ;
app.set('view engine', 'ejs') ;
app.set('views', path.join(__dirname, '..', 'view') )
app.use(CookieParser()) ;

app.use(auth)
app.use(userMiddleware) ;
app.use(home) ;

app.use(['/products/buy_product', '/login/user'], security);


mongoose.connect(DB_URL).then(() => {
    console.log('DB Connected')
    app.listen(PORT,'0.0.0.0', () => {
    console.log(`server running at - http://localhost:${PORT}`)
})
}).catch(error => {
    console.log("DB Error", error) ;
})

