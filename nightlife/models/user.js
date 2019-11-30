var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

mongoose.Promise = global.Promise

var UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    goList: Array
}, {collection: "colNightlife"});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);
