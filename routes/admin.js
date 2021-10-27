const express = require("express");
const router = express.Router();
const passport = require("passport");

// Load User model
const User = require("../models/User");
const Notification = require("../models/Notification");

// Auth types
const isAdmin = require("./auth").isAdmin;
const isNotAuth = require("./auth").isNotAuth;
const isAuth = require("./auth").isAuth;
const forwardAuthenticated = require("./auth").isNotAuth;
const { ObjectId } = require("bson");

router.get("/", isAdmin, async (req, res) => {
  const clientCount = await User.count({ user_type: "client" });
  const lawyerCount = await User.count({ user_type: "lawyer" });

  res.render("./admin/dashboard", {
    layout: "./layouts/admin-layout",
    clientCount,
    lawyerCount,
  });
});

router.get("/accounts", isAdmin, async (req, res) => {
  const accountsDoc = await User.find({ is_verified: false })

  res.render("./admin/accounts-authentication", {
    layout: "./layouts/admin-layout",
    accountsDoc
  });
});

// Lawyer Account Routes
router.get("/accounts/lawyer", isAdmin, async (req, res) => {
  const lawyerDocs = await User.find({ user_type: "lawyer" })
  res.render("./admin/lawyers", { layout: "./layouts/admin-layout", lawyerDocs });
});

// Client Account Routes
router.get("/accounts/client", isAdmin, async (req, res) => {
  const clientDocs = await User.find({ user_type: "client" })
  res.render("./admin/clients", { layout: "./layouts/admin-layout", clientDocs });
});

router.get("/accounts/:id", isAdmin, async (req, res) => {
  const id = ObjectId(req.params.id)
  const user_client = await User.findById({ layout: false, _id: id })

  res.render("./admin/user-view", { layout: false, user: user_client })
})

router.get("/pending", isAdmin, async (req, res) => {
  res.render("./admin/pending", { layout: "./layouts/admin-layout" });
});

// VERIFY USER
router.get("/verification/:id", isAdmin, async (req, res) => {
  const id = req.params.id
  const user = await User.findOne({ _id: id })

  res.render("./admin/verification-view", { layout: false, user })
})

router.patch("/verification/:id", isAdmin, async (req, res) => {
  const id = ObjectId(req.params.id)

  await User.findByIdAndUpdate({ _id: id }, { is_verified: true })
  req.flash("success_msg", "Successfully verified a user")
  res.redirect('/admin/accounts')
})

router.get("/")

module.exports = router;
