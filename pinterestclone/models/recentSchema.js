var mongoose = require("mongoose");
//var passportLocalMongoose = require("passport-local-mongoose");

var holdRecentSchema = new mongoose.Schema({
    holdAllRecent: Array
}, {collection: "holdRecentCol"});

//holdRecentSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("RecentSchema", holdRecentSchema);
