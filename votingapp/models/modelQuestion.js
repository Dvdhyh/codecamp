var mongoose = require("mongoose");

var QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true},
    options:{ type: Object, required: true},
}, {collection: "questionList"});

module.exports = mongoose.model("questions", QuestionSchema);
