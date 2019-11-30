var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password:{ type: String, required: true},
    polls: [
        { type: mongoose.Schema.ObjectId, ref: "questions"}
    ]
}, {collection: "membersList"});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
