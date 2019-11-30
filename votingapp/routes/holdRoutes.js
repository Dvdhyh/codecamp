var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
	expressSession = require("express-session");

var User = require("../models/user.js");
var questionItem = require("../models/modelQuestion.js");

var router = express.Router();

//If user is not logged in bring to home page
var isLogOffHomePage = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("", {layout: "layoutLoggedOut.hbs"});
}

//Router Home Page
router.get("/", isLogOffHomePage, function(req,res){
    res.render("", {layout: "layoutLoggedIn.hbs"});
});

// LOGIN
// render login form
router.get("/login", function(req, res) {
   res.render("login", {layout: "layoutLoggedOut.hbs"});
});

//login logic
//middleware
router.post("/loginForm", passport.authenticate("local", {
   successRedirect: "/polls",
   failureRedirect: "/login"
}), function(req, res) {});

//sign up page
router.get("/register", function(req, res) {
    res.render("register", {layout: "layoutLoggedOut.hbs"});
});

// register post
router.post("/registerForm", function(req,res){
    User.register(new User({
        username: req.body.username,
        password: req.body.password,
        polls: []}),
        req.body.password, function(err, user)
    {
        if(err){
            console.log(err);
            res.render('errorpage');
        }
        res.render("login", {layout: "layoutLoggedOut.hbs"});
    });
});

// Create a new poll
router.get("/createPoll", isLogOffHomePage, function(req,res){
    res.render("createPoll", {layout: "layoutLoggedIn.hbs"});
});

// register post
router.post("/createPollForm", isLogOffHomePage, function(req,res){

    let holdObject = JSON.parse(req.body.objectCreatePoll);

    //Check if question is already asked
    questionItem.findOne({"question":holdObject.Question}, function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        if(doc != null){
            res.render("createPoll", {layout: "layoutLoggedIn.hbs", alreadyAsked: true});
        }
        else{
            var data = new questionItem({
                question: holdObject.Question,
                options: holdObject.Options
            })

            data.save();

            User.findOneAndUpdate({'username':req.user.username}, {$push: {"polls":data._id}}, {upsert:true, new: true, safe: true}, function(err, doc1){
                if(err)
                    return res.status(500).send({error: err});

                res.render("selectedPoll", {layout: "layoutLoggedIn.hbs", showSelectedPoll: data});
            });
        }
    });
});

// Create a new poll
router.get("/deletePoll", isLogOffHomePage, function(req, res) {
    User.findOne({'username':req.user.username}).populate({
        path: "polls",
    }).then((doc) => {
        var tempPoll = doc.polls;
        res.render("deletePoll", {layout: "layoutLoggedIn.hbs", showPoll:tempPoll});
    }).catch((err)=>{
        return res.status(500).send({error: err});
    });
});

// delete selected polls
router.post("/deletePollForm", isLogOffHomePage, function(req, res) {
    User.findOneAndUpdate({'username':req.user.username},{$pull: {"polls": req.body.theQuestion}},{upsert: true, safe: true, new: true}, (err, doc) => {
        if(err)
            return res.status(500).send({error: err});


        User.findOne({'username':req.user.username}).populate({
            path: "polls",
        }).then((doc) => {
            var tempPoll = doc.polls;
            res.render("mypolls", {layout: "layoutLoggedIn.hbs", showPoll:tempPoll});
        }).catch((err)=>{
            return res.status(500).send({error: err});
        });

    });
});


//All polls
router.get("/polls", function(req,res){
    let useLayout = "layoutLoggedOut.hbs";
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs";
    }

    User.find({}).populate({
        path: "polls",
    }).then((doc) =>{
        return res.render("polls", {layout: useLayout, showPoll:doc});
    }).catch((err)=>{
        return res.status(500).send({error: err});
    });
});

// List my polls
router.get("/mypolls", isLogOffHomePage, function(req, res){
    User.findOne({'username':req.user.username}).populate({
        path: "polls",
    }).then((doc) => {
        var tempPoll = doc.polls;
        res.render("mypolls", {layout: "layoutLoggedIn.hbs", showPoll:tempPoll});
    }).catch((err)=>{
        return res.status(500).send({error: err});
    });
});

// Show selected polls
router.get("/selectedPoll",  function(req,res,next){
    let useLayout = "layoutLoggedOut.hbs";
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs";
    }
    res.render("selectedPoll", {layout: useLayout});
});

// Show selected polls
router.post("/selectedPollForm",  function(req,res){
    let useLayout = "layoutLoggedOut.hbs"
    let isLogged = false
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs"
        isLogged = true
    }

    questionItem.findById(req.body.theQuestion, (err, doc) => {
        if(err)
            return res.status(500).send({error: err});

        res.render("selectedPoll", {layout: useLayout, showSelectedPoll:doc, loggedOn: isLogged});
    });
});


// Add score
router.post("/AddScoreForm",function(req, res, next) {
    let useLayout = "layoutLoggedOut.hbs"
    let isLogged = false
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs"
        isLogged = true
    }

    questionItem.findByIdAndUpdate(req.body.theQuestion, {$inc: {["options." + req.body.theScore]: 1}}, {upsert: true, safe: true, new: true}, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        res.render("selectedPoll", {layout: useLayout, showSelectedPoll:doc, loggedOn: isLogged});
    });
});


// Add option to poll
router.post("/addOptionForm", isLogOffHomePage, function(req, res) {
    let useLayout = "layoutLoggedOut.hbs"
    let isLogged = false
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs"
        isLogged = true
    }

    questionItem.findById(req.body.theQuestion, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        doc.options[req.body.newOption] = 0;
        doc.save();
        res.render("selectedPoll", {layout: useLayout, showSelectedPoll:doc, loggedOn: isLogged});
    });
});


router.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/");
});


router.get("favicon.ico"), function(req, res){
    res.sendStatus(204);
}

module.exports = router;
