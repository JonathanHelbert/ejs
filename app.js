if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport')
const session = require('express-session')
const flash = require('express-flash')
const dbConnection = require('./config/db')

/**
 * -------------- DATABASE CONNECTION ----------------
 */
dbConnection()

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000

/**
 * -------------- STATIC FILES ----------------
 */

app.use(express.static('public'))
app.use('./css', express.static(__dirname + 'public/css'))

/**
 * -------------- TEMPLATING ENGINE ----------------
 */

app.use(expressLayouts)
app.set('layout', './layouts/full-width')
app.set('view engine', 'ejs')

/**
 * -------------- SESSION SETUP ----------------
 */

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false
    })
);

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

// Need to require the entire Passport config module so app.js knows about it
require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());
// FLASH MIDDLEWARE
app.use(flash())

// Save to Global Vars Logged In
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated()
    next()
})

/**
 * -------------- ROUTES ----------------
 */

const index = require('./routes/index')
const userRoutes = require('./routes/users')

app.use('/', index)
app.use('/users', userRoutes)

// Listening to port
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})