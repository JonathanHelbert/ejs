const express = require('express');
const router = express.Router();
const authUtils = require('../utils/crypto')
const passport = require('passport');
const transporter = require("../config/nodemailer")

// Load User model
const User = require('../models/User');
const Notification = require('../models/Notification')

// Auth types
const forwardAuthenticated = require('./auth').isNotAuth;
const isClient = require('./auth').isClient
const isLawyer = require('./auth').isLawyer
const isAdmin = require('./auth').isAdmin;
const { ObjectId } = require('bson');
const { isAuth } = require('./auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register POST
router.post('/register', (req, res) => {
    const {
        username,
        email,
        password,
        password2,
        user_fname,
        user_lname,
        birthdate,
        contact_number,
        permanent_address,
        city,
        zip,
        user_type,
        is_available,
        affiliation,
    } = req.body;

    // SETTING UP FILE UPLOAD
    let lawyer_credential
    let fileObj

    let errors = [];

    if (!username || !email || !password || !password2 || !user_fname || !user_lname || !birthdate || !contact_number || !permanent_address || !city || !zip) errors.push({ msg: 'Please enter all fields' });

    if (username.length > 20) errors.push({ msg: 'Username cannot be longer than 20 characters' })

    if (password != password2) errors.push({ msg: 'Passwords do not match' });

    if (password.length < 6 || password.length > 20) errors.push({ msg: 'Password must be at least 6 characters, and not more than 20 characters long' });

    if (errors.length > 0) {
        res.render('register', {
            errors,
            username,
            email,
            password,
            password2,
            user_fname,
            user_lname,
            birthdate,
            contact_number,
            permanent_address,
            city,
            zip,
            user_type
        });
    } else {
        User.findOne({ $or: [{ username: username }, { email: email }] }).then(user => {
            if (user) {
                errors.push({ msg: 'Username or email already exist' });
                res.render('register', {
                    errors,
                    username,
                    email,
                    password,
                    password2,
                    user_fname,
                    user_lname,
                    birthdate,
                    contact_number,
                    permanent_address,
                    city,
                    zip,
                    user_type
                });
            } else {
                let newUser = new User()
                if (user_type == "client") {
                    newUser = new User({
                        username,
                        email,
                        password,
                        user_fname,
                        user_lname,
                        birthdate,
                        contact_number,
                        permanent_address,
                        city,
                        zip,
                        user_type
                    });
                } else if (user_type == "lawyer") {
                    if (req.files) {
                        fileObj = req.files.lawyer_credential
                        lawyer_credential = Date.now() + '-' + Math.round(Math.random() * 1E9) + fileObj.name
                    }

                    newUser = new User({
                        username,
                        email,
                        password,
                        user_fname,
                        user_lname,
                        birthdate,
                        contact_number,
                        permanent_address,
                        city,
                        zip,
                        user_type,
                        is_available,
                        lawyer_credential,
                        affiliation
                    });

                    fileObj.mv('./public/uploads/credentials/' + lawyer_credential)
                }

                newUser.password = authUtils.hashPassword(password);
                newUser.save()

                rand = newUser._id
                host = req.get('host');
                link = "http://" + req.get('host') + "/verify?id=" + rand;

                const options = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: "Registration confirmation with 3JBG Legal Web Application!",
                    html: `<h1>Hello ${user_fname},</h1><br> Please Click on the link to verify your email.<br><a href=` + link + ">Click here to verify</a>"
                }
                transporter.sendMail(options, (err, data) => {
                    try {
                        if (err) throw Error(err)
                        else console.log("Email sent")
                    } catch (err) {
                        console.log(err)
                    }

                })


                req.flash('success_msg', 'You are now registered please log in to continue')
                res.redirect('/users/login')
            }
        });
    }
});

// Login
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })
);

// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');

});

// Protected Routes

// Public Profile View
router.get('/:id', isAuth, (req, res) => {
    const id = ObjectId(req.user._id)
    const _id = req.params.id
    User.findOne({ _id }, async (err, result) => {
        if (err) throw err

        const notifications = await Notification.find({ target: id })

        res.render('public-profile', { result, user_id: id, param_id: _id, notifications })
    })
})

// Profile Edit View
router.get('/edit/:id', isAuth, (req, res) => {
    const id = ObjectId(req.user._id)

    if (id == req.params.id) {
        User.findOne({ _id: id }, async (err, result) => {
            if (err) throw err

            const notifications = await Notification.find({ target: id })

            res.render('profile-edit', { result, user_id: id, notifications })
        })
    }
    else {
        req.flash('error_msg', 'You do not have the authority to view that resource')
        res.redirect('/users/' + id)
    }
})

// DELETE with 404 Status
router.delete('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        await user.remove()
        res.send({ data: true })
    } catch {
        res.status(404).send({ error: 'User is not found' })
    }
})

// UPDATE with 500 Status
router.patch('/edit/:id', isAuth, async (req, res) => {
    try {
        const filter = req.params.id
        const update = req.body
        await User.findOneAndUpdate({ _id: filter }, update)

        req.flash('success_msg', 'Profile Succesfully Updated')
        res.redirect('/users/' + filter)
    } catch {
        res.status(500).send({ error: "There was an error in updating the user" })
    }
})

router.patch('/edit/public/:id', isAuth, async (req, res) => {
    try {
        const filter = req.params.id
        const update = await User.findOne({ _id: filter })
        is_public = !update.is_public
        const success = await User.findOneAndUpdate({ _id: filter }, { is_public })
        const message = !update.is_public ? "public" : "private"

        req.flash('success_msg', `Profile is now ${message}`)
        res.redirect('/users/' + filter)
    } catch {
        res.status(500).send({ error: "There was an error in updating the user" })
    }
})

router.patch('/edit/is_available/:id', isAuth, async (req, res) => {
    try {
        const filter = req.params.id
        const update = await User.findOne({ _id: filter })
        is_available = !update.is_available
        const success = await User.findOneAndUpdate({ _id: filter }, { is_available })
        const message = !update.is_available ? "available" : "unavailable"

        req.flash('success_msg', `You are now ${message} for service`)
        res.redirect('/users/' + filter)
    } catch {
        res.status(500).send({ error: "There was an error in updating the user" })
    }
})

module.exports = router;