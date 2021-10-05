const express = require("express");
const router = express.Router();

// Load User model
const User = require("../models/User");

// Auth types
const isClient = require("./auth").isClient;
const isNotAuth = require("./auth").isNotAuth;
const isAuth = require("./auth").isAuth;
const { ObjectId } = require("bson");

// Welcome Page
router.get("/", isNotAuth, (req, res) => res.render("index"));

// Protected Routes

// Dashboard
router.get("/dashboard", isAuth, (req, res) => {
  const id = ObjectId(req.user._id);
  let page = parseInt(req.query.page);
  let size = parseInt(req.query.size);
  if (!page) page = 1;
  if (!size) size = 10;

  const startIndex = (page - 1) * size;
  const endIndex = page * size;

  User.find({ user_type: "lawyer", is_available: true }).exec(
    async (err, data) => {
      if (err) throw err;

      let user_doc = await User.findOne({ _id: id }).populate("complaints");
      let complaints = user_doc.complaints;

      const complaintResults = complaints.slice(startIndex, endIndex);

      res.render("dashboard", {
        user_id: id,
        result: data,
        user_doc,
        complaintResults,
        endingLink: Math.ceil(complaints.length / 10),
        page,
      });
    }
  );
});

router.get("/advice", isAuth, (req, res) => {});

module.exports = router;
