const express = require("express");
const router = express.Router();

// Load User model
const User = require("../models/User");
const Notification = require("../models/Notification");
const Advice = require('../models/Advice')

// Auth types
const isLawyer = require("./auth").isLawyer;
const isAuth = require("./auth").isAuth;
const { ObjectId } = require("bson");

router.get("/", isAuth, async (req, res, next) => {
    try {
        const id = ObjectId(req.user._id);

        // DATA VARIABLE QUERIES
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const size = req.query.size ? parseInt(req.query.size) : 10;
        const filter = req.query.filter
        let adviceResult
        let advicesDoc
        const startIndex = (page - 1) * size;
        const endIndex = page * size;

        const notifications = await Notification.find({ target: id });

        // APPLY SEARCH LOGIC HERE
        if (filter) {
            advicesDoc = await Advice.find({ legal_title: new RegExp(filter, 'i') }).sort({ 'date_submitted': 'desc' })
            adviceResult = advicesDoc
        } else {
            advicesDoc = await Advice.find({},).sort({ 'date_submitted': 'desc' })
            adviceResult = advicesDoc.slice(startIndex, endIndex)
        }

        const numberOfPages = Math.ceil(advicesDoc.length / size)
        const iterator = (page - 5) < 1 ? 1 : page - 5;
        let endingLink = (iterator + 9) <= numberOfPages ? (iterator + 9) : page + (numberOfPages - page);

        res.render("advice-forum", {
            user_id: id,
            notifications,
            advices: adviceResult,
            endingLink,
            page,
            iterator,
        })
    } catch (err) {
        next(err)
    }
});

router.post("/", isAuth, async (req, res, next) => {
    try {
        const id = ObjectId(req.user._id)
        const { legal_title, legal_description } = req.body

        const newAdvice = new Advice({
            client_id: id,
            legal_title: legal_title,
            legal_description: legal_description
        })

        await newAdvice.save()

        res.redirect('/advice')
    } catch (err) {
        next(err)
    }
})

router.get("/:id", isAuth, async (req, res, next) => {
    try {
        const id = ObjectId(req.user._id)
        const advice_id = ObjectId(req.params.id)

        const notifications = await Notification.find({ target: id });
        const adviceDoc = await Advice.findOne({ _id: advice_id }).populate("lawyers._id")
        const userDoc = await User.findOne({ _id: adviceDoc.client_id })
        const lawyersDoc = adviceDoc.lawyers
        const loginDoc = await User.findOne({ _id: id })

        if (typeof adviceDocs == undefined) adviceDocs = null

        res.render("advice-view", {
            user_id: id,
            notifications,
            adviceDoc,
            userDoc,
            lawyersDoc,
            loginDoc,
        })
    } catch (err) {
        next(err)
    }
})

router.patch("/comment/:id", isLawyer, async (req, res, next) => {
    try {
        const id = ObjectId(req.user._id)
        const advice_id = ObjectId(req.params.id)
        const { answer } = req.body

        const lawyer = {
            _id: id,
            answer: answer,
        }

        const adviceDoc = await Advice.findByIdAndUpdate({ _id: advice_id }, { $push: { lawyers: lawyer } })

        res.redirect('/advice/' + advice_id)
    } catch (err) {
        next(err)
    }
})

router.get("/vote/:id", isAuth, async (req, res, next) => {
    try {
        const vote_id = ObjectId(req.params.id)

        await Advice.findByIdAndUpdate({ _id: vote_id }, { is_resolved: true })

        res.redirect('/advice/' + vote_id)
    } catch (err) {
        next(err)
    }
})

module.exports = router