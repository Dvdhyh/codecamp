var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

mongoose.Promise = global.Promise

var UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password:{ type: String, required: true},
    userFullName: String,
    userCity: String,
    userState: String,
    bookDetails: [{ type: mongoose.Schema.ObjectId, ref: "bookModel"}]
}, {collection: "membersCol"});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
