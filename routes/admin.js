const express = require("express");
const router = express.Router();
const passport = require('passport');

// Load User model
const User = require("../models/User");
const Notification = require("../models/Notification");

// Auth types
const isAdmin = require("./auth").isAdmin;
const isNotAuth = require("./auth").isNotAuth;
const isAuth = require("./auth").isAuth;
const forwardAuthenticated = require("./auth").isNotAuth
const { ObjectId } = require("bson");

router.get("/", isAdmin, async (req, res) => {
  res.render("./admin/dashboard", { layout: "./layouts/admin-layout" });
});

router.get("/accounts", isAdmin, async (req, res) => {
  res.render("./admin/accounts-authentication", {
    layout: "./layouts/admin-layout",
  });
});

router.get("/accounts/lawyer", isAdmin, async (req, res) => {
  res.render("./admin/lawyers", { layout: "./layouts/admin-layout" });
});

router.get("/accounts/client", isAdmin, async (req, res) => {
  res.render("./admin/clients", { layout: "./layouts/admin-layout" });
});

router.get("/pending", isAdmin, async (req, res) => {
  res.render("./admin/pending", { layout: "./layouts/admin-layout" });
});

module.exports = router;
