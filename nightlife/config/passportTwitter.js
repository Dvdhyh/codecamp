const TwitterStrategy = require("passport-twitter").Strategy,
    User = require("../models/user");

require("dotenv/config")

const key = process.env.M_TWITTER_KEY || process.env.TWITTER_KEY,
    secret = process.env.M_TWITTER_SECRET || process.env.TWITTER_SECRET

const callbackTwitter = "https://ffc-nightlife.herokuapp.com/l/twitterReturnNightlife"
//const callbackTwitter = "http://localhost:8000/l/twitterReturnNightlife"

module.exports = function(passport){
    passport.use(new TwitterStrategy({
        consumerKey: key,
        consumerSecret: secret,
        callbackURL: callbackTwitter
    },function(token, tokenSecret, profile, cb) {
        //User.findOrCreate({ twitterId: profile.id }, function (err, user) {
            return cb(null, profile);
        //});
    }));

    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });
}
