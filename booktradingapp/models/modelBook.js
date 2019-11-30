var mongoose = require("mongoose");

mongoose.Promise = global.Promise

var bookSchema = new mongoose.Schema({
    theTitle: String,
    theImage: String,
    theOwner: String,
    theOwnerUser: String,
    theRequestUser: [String],
    theRequestUsername: [String],
    theStatus: String,
    askReturn: String,
}, {collection: "bookCol"});

module.exports = mongoose.model("bookModel", bookSchema);
