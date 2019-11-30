var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
	expressSession = require("express-session");

var User = require("../models/user.js");
var RecentSch = require("../models/recentSchema.js");

var router = express.Router();


//If holdAllRecent list doesn't exist yet, create it
RecentSch.find().then(function(doc){
    if(doc.length == 0){
        var data = new RecentSch({holdAllRecent: []});

        data.save();
    }
});

router.get('/twitterLogin', passport.authenticate('twitter'));

var holdTwitterName;

router.get('/twitterReturn',
    passport.authenticate('twitter', {
        failureRedirect: '/login'
}),function(req, res) {
    // Successful authentication, redirect home.

    holdTwitterName = req.screen_name || req.user.username;
    //req.screen_name is username from twitter

    //Check if twitter account already exist
    User.findOne({"username":holdTwitterName},function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        //if doesn't not exist
        if(doc == null){
            //Just need to get a username
            res.redirect("registerTwitter");
        }else{
            res.redirect('allImages');
        }
    })
});


router.get("/", function(req,res,next){
    if(req.isAuthenticated())
        return next();
    res.render("", {layout: "layoutLoggedOut.hbs"});
}, function(req, res) {
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
   successRedirect: "/allImages",
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
            mylinks: []
        }), req.body.password, function(err, user){

        if(err){
            console.log(err);
            res.render('errorpage');
        }
        res.render("login", {layout: "layoutLoggedOut.hbs"});
    });
});

//sign up page
router.get("/registerTwitter", function(req, res) {
    res.render("registerTwitter", {layout: "layoutLoggedOut.hbs", hbsVar: holdTwitterName});
});

// register post
router.post("/twitterRegisterForm", function(req,res){
    User.register(new User({
            username: req.body.username,
            password: req.body.password,
            mylinks: []
        }), req.body.password, function(err, user){

        if(err){
            console.log(err);
            res.render('errorpage');
        }
        let temp = {
            username: req.body.username,
            password: req.body.password
        }
        res.render("loginTwitter", {layout: "layoutLoggedOut.hbs", hbsVar:temp});
    });
});



// Create a new poll
router.get("/addImage", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("", {layout: "layoutLoggedOut.hbs"});
}, function(req, res) {
    res.render("addImage", {layout: "layoutLoggedIn.hbs"});
});

// form for adding a Image
router.post("/addImageForm", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("", {layout: "layoutLoggedOut.hbs"});
}, function(req,res){
    let tempImg;
    if(req.body.theImage == null || req.body.theImage == undefined){
        tempImg = "https://placeholdit.imgix.net/~text?txtsize=33&txt=350%C3%97150&w=350&h=150";
    } else {
        tempImg = req.body.theImage;
    }

    let timestamp = new Date().getUTCMilliseconds();

    let tempObj = {
        theTitle: req.body.theTitle,
        theImage: tempImg,
        thePostedUser: req.user.username,
        theLikes: 0,
        theID: timestamp
    }

    //Add to Recent List
    RecentSch.findOne({},function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        doc["holdAllRecent"].unshift(tempObj);
        doc.save();
    });

    let prom = User.findOne({'username':req.user.username}).exec();
    prom.then(function(doc){
        doc["mylinks"].push(tempObj);

        return doc.save();
    }).then(function(doc){
        res.render("myImages", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

// Removing a Image page
router.get("/removeImage", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("", {layout: "layoutLoggedOut.hbs"});
}, function(req, res) {
    User.findOne({'username':req.user.username}, function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        res.render("removeImage", {layout: "layoutLoggedIn.hbs", hbsVar: doc.mylinks});
    });
});

// Remove the Image from collection
router.post("/removeImageForm",  function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("", {layout: "layoutLoggedOut.hbs"});
},function(req, res) {

    //Remove from recent list
    RecentSch.findOne({},function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        //Remove from the Image list
        for(let i=0; i < doc.holdAllRecent.length; ++i){
            if(req.body.theID == doc.holdAllRecent[i].theID){
                doc.holdAllRecent.splice(i, 1);
                break;
            }
        }

        doc.save();
    });

    //Remove from user list
    let prom = User.findOne({'username':req.user.username}).exec();
    prom.then(function(doc){

        //Remove from the Image list
        for(let i=0; i < doc.mylinks.length; ++i){
            if(req.body.theID == doc.mylinks[i].theID){
                doc.mylinks.splice(i, 1);
                break;
            }
        }

        return doc.save();
    }).then(function(doc){
        res.render("myImages", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

//List all Image
router.get("/allImages", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    RecentSch.find().then(function(doc){
        res.render("allImages", {layout: "layoutLoggedOut.hbs", hbsVar:doc});
    });
}, function(req, res) {
    RecentSch.find().then(function(doc){
        res.render("allImages", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    });
});

// List my Images
router.get("/myImages", function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.render("/", {layout: "layoutLoggedOut.hbs"});
}, function(req, res){

    let prom = User.findOne({'username':req.user.username}).exec();

    prom.then(function(doc){
        return doc.save();
    }).then(function(doc){
        res.render("myImages", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

// List user Images
router.get("/visitUser", function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    User.findOne({'username':req.body.thePostedUser}, function(err, doc){
        if(err)
            return res.status(500).send({error: err});
        res.render("visitUser", {layout: "layoutLoggedOut.hbs", hbsVar: doc});
    });
}, function(req, res){

    let prom = User.findOne({'username':req.body.thePostedUser}).exec();

    prom.then(function(doc){
        return doc.save();
    }).then(function(doc){
        res.render("visitUser", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

// List user's Images
router.post("/visitUserForm", function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    let prom = User.findOne({'username':req.body.thePostedUser}).exec();
    prom.then(function(doc){
        return doc.save();
    }).then(function(doc){
        res.render("visitUser", {layout: "layoutLoggedOut.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
}, function(req, res){

    let prom = User.findOne({'username':req.body.thePostedUser}).exec();
    prom.then(function(doc){
        return doc.save();
    }).then(function(doc){
        res.render("visitUser", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

// List my Images
router.post("/likeButtonForm", function(req, res){
    let prom = User.findOne({'theID':req.body.theID}).exec();

    prom.then(function(doc){
        //Remove from the Image list
        for(let i=0; i < doc.mylinks.length; ++i){
            if(req.body.theID == doc.mylinks[i].theID){
                doc.mylinks[i].theLikes = doc.mylinks[i].theLikes++;
                break;
            }
        }

        return doc.save();
    }).then(function(doc){
        //res.render("visitUser", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});



//User settings data
router.get("/settings",function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.render("/", {layout: "layoutLoggedOut.hbs"});
},function(req, res) {
    let prom = User.findOne({'username':req.user.username}).exec();
    prom.then(function(doc){
        return doc.save();
    }).then(function(doc){
        res.render("settings", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
    });
});

// Edit settings form
router.post("/profileForm",  function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("/", {layout: "layoutLoggedOut.hbs"});
},function(req, res) {
    let prom = User.findOne({'username':req.user.username}).exec();
    prom.then(function(doc){

        doc.userCity = req.body.userCity;
        doc.userState = req.body.userState;

        return doc.save();
    }).then(function(doc){
        res.render("settings", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    }).catch(function(err){
        return res.status(500).send({error: err});
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
