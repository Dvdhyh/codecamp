var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password:{ type: String, required: true},
    mylinks: Array,
    userCity: String,
    userState: String
}, {collection: "pinterestCol"});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);
//module.exports = mongoose.model("RecentSchema", holdRecentSchema);
