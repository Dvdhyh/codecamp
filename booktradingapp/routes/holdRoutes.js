var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
	expressSession = require("express-session");

const request = require("request")

var dbUser = require("../models/user.js");
var dbBooks = require("../models/modelBook.js");

var router = express.Router();

//Return to home page
var isLoggedInHomePage = function(req, res, next){
    if(req.isAuthenticated())
        return next();
    res.render("", {layout: "layoutLoggedOut.hbs"});
}

router.get("/", isLoggedInHomePage, function(req, res) {
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
   successRedirect: "/allbooks",
   failureRedirect: "/login"
}), function(req, res) {});

//sign up page
router.get("/register", function(req, res) {
    res.render("register", {layout: "layoutLoggedOut.hbs"});
});

// register post
router.post("/registerForm", function(req,res){
    dbUser.register(new dbUser({
            username: req.body.username,
            password: req.body.password,
            userFullName: req.body.userFullName,
            userCity: req.body.userCity,
            userState: req.body.userState,
            bookDetails: [],
            bookYouRequested: [],
            bookRequested: [],
            bookBorrowed: [],
            bookLent: []
        }), req.body.password, function(err, user){

        if(err){
            console.log(err);
            res.render('errorpage');
        }
        res.render("login", {layout: "layoutLoggedOut.hbs"});
    });
});

// Create a new poll
router.get("/addbook", isLoggedInHomePage, function(req, res) {
    res.render("addbook", {layout: "layoutLoggedIn.hbs"});
});

var compareTitle = function(title1, title2){
    for(let i=0; i < title1.length; i++){
        if(title1[i] != title2[i]){
            return false;
        }
    }
    return true;
}

// form for adding a book
router.post("/addBookForm", isLoggedInHomePage, function(req,res){

    let bookTitleCover = req.body.theTitle.toUpperCase()
    //If book isn't already in the list
    dbBooks.findOne({"theTitle":bookTitleCover}, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        //If book not yet added
        if(doc == null){

            //Get Book cover
            let googleBookAPI = "https://www.googleapis.com/books/v1/volumes?q=" + req.body.theTitle + "&maxResults=1";

            request.get({
                url:googleBookAPI,
                json:true,
                headers:{
                    "Content-Type":"application/json"
                }
            }, function(err, requestRes, requestBody){

                //If no match found give placeholder img
                let tempImg;
                if( compareTitle(bookTitleCover, requestBody.items[0].volumeInfo.title.toUpperCase()) ){
                    tempImg = requestBody.items[0].volumeInfo.imageLinks.smallThumbnail;
                } else {
                    tempImg = "https://placeholdit.imgix.net/~text?txtsize=33&txt=150%C3%97150&w=150&h=150";
                }

                //Create new book item
                let data = new dbBooks({
                    theTitle: bookTitleCover,
                    theStatus: "",
                    theImage: tempImg,
                    theOwnerUser: req.user.username,
                    theOwner: req.user._id,
                    theRequestUser: [],
                    askReturn: false
                })
                data.save();


                let tempClient = {
                    showselectedbook:data,
                    loggedOn:true,
                    currentUser:req.user.username,
                    currentId:req.user._id
                };

                //Add book to users book list
                dbUser.findById(req.user._id, (err, doc)=>{
                    if(err)
                        return res.status(500).send({error: err});

                    doc.bookDetails.push(data._id);

                    doc.save((err)=>{
                        if(err)
                            return res.status(500).send({error: err});

                        dbUser.populate(doc, {
                            path: "bookDetails",
                            select: "-password"
                        }, (err, doc1)=>{
                            if(err)
                                return res.status(500).send({error: err});

                            let tempClient = {
                                showselectedbook:doc1,
                                loggedOn: true,
                                currentUsername:req.user.username,
                                currentUser: req.user._id
                            };
                            return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
                        });
                    });
                })
            });
        }
        else{
            //if book already added
            res.render("addbook", {layout: "layoutLoggedIn.hbs", hbsVar: true});
        }
    });
});

// Removing a book page
router.get("/removebook", isLoggedInHomePage, function(req, res) {
    dbUser.findById(req.user._id).populate({
        path: "bookDetails",
        select: "-password"
    }).then((doc)=>{
        let tempClient = {
            showselectedbook:doc,
            loggedOn: true,
            currentUsername:req.user.username,
            currentUser: req.user._id
        };
        return res.render("removebook", {layout: "layoutLoggedIn.hbs", hbsVar: tempClient});
    }).catch((err)=>{
        return res.status(500).send({error: err});
    });
});


// Remove the book from collection
router.post("/removebookForm", isLoggedInHomePage,function(req, res) {

    let idBook = req.body.theTitle ;

    //Get book details
    dbBooks.findById(idBook, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        if(doc.theStatus == ""){
            //Delete from book model
            dbBooks.findByIdAndRemove(idBook).exec();

            //Load current user's book lists
            dbUser.findById(req.user._id, (err, doc1)=>{
                if(err)
                    return res.status(500).send({error: err});
                //Remove from owners list
                doc1.bookDetails.splice(doc1.bookDetails.indexOf(idBook), 1);
                doc1.save((err)=>{
                    if(err)
                        return res.status(500).send({error: err});

                    dbUser.populate(doc1, {
                        path: "bookDetails",
                        select: "-password"
                    }, (err, doc1)=>{
                        if(err)
                            return res.status(500).send({error: err});

                        let tempClient = {
                            showselectedbook:doc1,
                            loggedOn: true,
                            currentUsername:req.user.username,
                            currentUser: req.user._id
                        };
                        return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
                    });
                });
            })
        }
        else{
            //Load current user's book lists
            dbUser.findById(req.user._id).populate({
                path: "bookDetails",
                select: "-password"
            }).then((doc3)=>{
                let tempClient = {
                    showselectedbook:doc3,
                    loggedOn: true,
                    currentUsername:req.user.username,
                    currentUser: req.user._id
                };
                return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
            }).catch((err)=>{
                return res.status(500).send({error: err});
            });
        }
    });
});

//List all book
router.get("/allbooks", function(req,res,next){
    let useLayout = "layoutLoggedOut.hbs"
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs"
    }

    dbBooks.find({}, (err, doc) =>{
        if(err)
            return res.status(500).send({error: err});

        return res.render("allbooks", {layout: useLayout, hbsVar:doc});
    });
});

// List my books
router.get("/mybooks", isLoggedInHomePage, function(req, res){

    dbUser.findById(req.user._id).populate({
        path: "bookDetails",
        select: "-password"
    }).then((doc)=>{
        let tempClient = {
            showselectedbook:doc,
            loggedOn: true,
            currentUsername:req.user.username,
            currentUser: req.user._id
        };
        return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
    }).catch((err)=>{
        return res.status(500).send({error: err});
    });
});

// Show selected book
router.get("/selectedbook",  function(req,res,next){
    let useLayout = "layoutLoggedOut.hbs"
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs"
    }
    res.render("selectedbook", {layout: useLayout});
});

// Show selected book
router.post("/selectedbookForm",  function(req,res,next){
    let useLayout = "layoutLoggedOut.hbs",
        isLogged = false,
        userData = null
    if(req.isAuthenticated()){
        useLayout = "layoutLoggedIn.hbs";
        isLogged = true;
        userData = req.user._id;
    }

    dbBooks.findById(req.body.theTitle, function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        let tempClient = {
            showselectedbook:doc,
            loggedOn: isLogged,
            currentUser: userData,
        };

        res.render("selectedbook", {layout: useLayout, hbsVar:tempClient});
    });
});

// Request the selected book
router.post("/requestBookForm",  function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("login", {layout: "layoutLoggedOut.hbs"});
},function(req, res) {
    //Add book to users requested list
    dbBooks.findById(req.body.theTitle, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        //if user hasn't already requested the book, add to list
        if(doc.theRequestUser.indexOf(req.user._id) == -1){
            doc.theRequestUser.push(req.user._id)
            doc.theRequestUsername.push(req.user.username);
            doc.save();

            //Add to user list
            dbUser.findById(req.user._id, (err, doc1)=>{
                if(err)
                    return res.status(500).send({error: err});

                doc1.bookDetails.push(req.body.theTitle);
                doc1.save((err)=>{
                    if(err)
                        return res.status(500).send({error: err});

                    //Load current user's book lists
                    dbUser.populate(doc1, {
                        path: "bookDetails",
                        select: "-password"
                    }, (err, doc1)=>{
                        if(err)
                            return res.status(500).send({error: err});

                        let tempClient = {
                            showselectedbook:doc1,
                            loggedOn: true,
                            currentUsername:req.user.username,
                            currentUser: req.user._id
                        };
                        return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
                    });
                });
            })
        }
        else {
            //Load current user's book lists
            dbUser.findById(req.user._id).populate({
                path: "bookDetails",
                select: "-password"
            }).then((doc2)=>{
                let tempClient = {
                    showselectedbook:doc2,
                    loggedOn: true,
                    currentUsername:req.user.username,
                    currentUser: req.user._id
                };
                return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
            }).catch((err)=>{
                return res.status(500).send({error: err});
            });
        }
    })
});

// Remove the book from your request list
router.post("/cancelRequestForm", isLoggedInHomePage, function(req, res) {

    let idBook = req.body.theTitle ;

    //Get book details
    dbBooks.findById(idBook, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        if(doc.theStatus == ""){

            //Remove from request list
            let getIndex = doc.theRequestUser.indexOf(idBook)
            doc.theRequestUser.splice(getIndex, 1);
            doc.theRequestUsername.splice(getIndex, 1);
            doc.save()

            //Load current user's book lists
            dbUser.findById(req.user._id, (err, doc1)=>{
                if(err)
                    return res.status(500).send({error: err});

                doc1.bookDetails.splice(doc1.bookDetails.indexOf(idBook), 1);

                doc1.save((err)=>{
                    if(err)
                        return res.status(500).send({error: err});

                    dbUser.populate(doc1, {
                        path: "bookDetails",
                        select: "-password"
                    }, (err, doc1)=>{
                        if(err)
                            return res.status(500).send({error: err});

                        let tempClient = {
                            showselectedbook:doc1,
                            loggedOn: true,
                            currentUsername:req.user.username,
                            currentUser: req.user._id
                        };
                        return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
                    });
                })
            })
        }
        else{
            //Load current user's book lists
            dbUser.findById(req.user._id).populate({
                path: "bookDetails",
                select: "-password"
            }).then((doc3)=>{
                let tempClient = {
                    showselectedbook:doc3,
                    loggedOn: true,
                    currentUsername:req.user.username,
                    currentUser: req.user._id
                };
                return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
            }).catch((err)=>{
                return res.status(500).send({error: err});
            });
        }
    });
});


// Accept request to lent book
router.post("/pickForm", isLoggedInHomePage, function(req, res) {
    //Add book to users requested list
    dbBooks.findById(req.body.theTitle, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        return res.render("acceptList", {layout: "layoutLoggedIn.hbs", hbsVar:doc});
    })
});

// Accept request to lent book
router.post("/acceptForm", isLoggedInHomePage, function(req, res) {
    //Move book to request user
    dbBooks.findById(req.body.theId, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        doc.theStatus = req.body.theUser;
        doc.save();


        dbUser.findById(req.user._id).populate({
            path: "bookDetails",
            select: "-password"
        }).then((doc)=>{
            let tempClient = {
                showselectedbook:doc,
                loggedOn: true,
                currentUsername:req.user.username,
                currentUser: req.user._id
            };
            return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
        }).catch((err)=>{
            return res.status(500).send({error: err});
        });
    })
});


// Request the return of your book
router.post("/requestReturnForm", isLoggedInHomePage, function(req, res) {
    //Add book to users requested list
    dbBooks.findById(req.body.theTitle, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        doc.askReturn = "OwnerRequested"
        doc.save();

        dbUser.findById(req.user._id).populate({
            path: "bookDetails",
            select: "-password"
        }).then((doc)=>{
            let tempClient = {
                showselectedbook:doc,
                loggedOn: true,
                currentUsername:req.user.username,
                currentUser: req.user._id
            };
            return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
        }).catch((err)=>{
            return res.status(500).send({error: err});
        });
    })
});

// To return a book to it's owner
router.post("/returnForm", isLoggedInHomePage, function(req, res) {
    //get book details
    dbBooks.findById(req.body.theTitle, (err, doc)=>{
        if(err)
            return res.status(500).send({error: err});

        doc.theStatus = "";
        doc.askReturn = "";
        let getIndex = doc.theRequestUser.indexOf(req.body.theTitle)
        doc.theRequestUser.splice(getIndex, 1);
        doc.theRequestUsername.splice(getIndex, 1);
        doc.save()
        doc.save();

        //Load current user's book lists
        dbUser.findById(req.user._id, (err, doc1)=>{
            if(err)
                return res.status(500).send({error: err});

            doc1.bookDetails.splice(doc1.bookDetails.indexOf(req.body.theTitle), 1);

            doc1.save((err)=>{
                if(err)
                    return res.status(500).send({error: err});

                dbUser.populate(doc1, {
                    path: "bookDetails",
                    select: "-password"
                }, (err, doc1)=>{
                    if(err)
                        return res.status(500).send({error: err});

                    let tempClient = {
                        showselectedbook:doc1,
                        loggedOn: true,
                        currentUsername:req.user.username,
                        currentUser: req.user._id
                    };
                    return res.render("mybooks", {layout: "layoutLoggedIn.hbs", hbsVar:tempClient});
                });
            })
        })
    })
});


//User settings data
router.get("/settings",isLoggedInHomePage,function(req, res) {
    res.render("settings", {layout: "layoutLoggedIn.hbs", userDetails: req.user, loggedOn: true});
});

// Edit settings form
router.post("/profileForm", isLoggedInHomePage, function(req, res) {

    var tempDetails = {
        userFullName:req.body.userFullName,
        userCity:req.body.userCity,
        userState:req.body.userState
    }

    dbUser.findOneAndUpdate({'username':req.user.username}, {'userFullName':req.body.userFullName, "userCity": req.body.userCity, "userState": req.body.userState}, {upsert:false}, function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        res.render("settings", {layout: "layoutLoggedIn.hbs", userDetails:tempDetails, loggedOn: true});
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
