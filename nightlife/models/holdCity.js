var mongoose = require("mongoose");

mongoose.Promise = global.Promise

var citySchema = new mongoose.Schema({
    city: { type: String, required: true},
    venues: Array
}, {collection: "colCity"});

module.exports = mongoose.model("City", citySchema);
