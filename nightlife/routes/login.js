const express = require("express"),
    router = express.Router()
    passport = require("passport")

var User = require("../models/user.js");

router.get('/twitterLogin', passport.authenticate('twitter'));

router.get('/twitterReturnNightlife',
    passport.authenticate('twitter', {
        failureRedirect: '/'
}),function(req, res) {
    // Successful authentication, redirect home.
    let holdTwitterName = req.screen_name || req.user.username;
    //req.screen_name is username from twitter

    //Check if twitter account already exist
    User.findOne({"username":holdTwitterName},function(err, doc){
        if(err)
            return res.status(500).send({error: err});

        //if doesn't not exist
        if(doc == null){
            //Just need to get a username

            let tempPass = "1234567890";

            User.register(new User({
                    username: holdTwitterName,
                    password: tempPass,
                }), tempPass, function(err, user){

                if(err){
                    console.log(err);
                    res.render('errorpage');
                }
                let temp = {
                    username: holdTwitterName,
                    password: tempPass
                }
                
                res.redirect("/");
            });
        }else{
            res.redirect("/");
        }
    })
});

router.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/");
});


module.exports = router;
