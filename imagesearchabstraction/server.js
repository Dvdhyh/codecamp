"use strict"
const express = require('express'),
    app = express(),
    url = require("url"),
    mongoose = require("mongoose"),
    path = require("path"),
    bodyParser = require("body-parser"),
    request = require("request")

require("dotenv/config")

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: false }));

app.set('json spaces', 4);

const APIKEY = process.env.PIXABAY_KEY || process.env.H_PIXABAY_KEY,
    MONGODB = process.env.MONGODB_URI || "mongodb://localhost:27017/recentSearch"
mongoose.connect(MONGODB);
var Schema = mongoose.Schema;

var userDataSchema = new Schema({
    recentList: Array
}, {collection: 'imgAbs'});

var UserSearches = mongoose.model('UserSearches', userDataSchema);

//Create a recent list database. Only if it doesn't already exist
UserSearches.find({}, function(err, doc){
    if(err)
        console.log(err);

    if(doc.length == 0){
        let data = new UserSearches({
            recentList:[]
        });

        data.save();
    }
})

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + "/index.html"))
});

app.get('/searchImages', function(req, res) {
    //console.log(req.query)

    let searchTerm = req.query.searchString,
        searchPage = req.query.offset

    if(searchTerm == undefined || searchPage == undefined){
        res.redirect("/")
    }
    else{
        //Insert search into recent list
        UserSearches.find({}, function(err, doc){
            if(err)
                console.log(err);

            let getDate = Date()
            doc[0].recentList.unshift({
                date: getDate,
                searched: searchTerm
            })

            //saving to database
            doc[0].save();

            //Run pixabay api search to get json results
            let holdAPI = "https://pixabay.com/api/?key=" + APIKEY
                + "&q=" + searchTerm + "&image_type=photo&per_page=10&page=" + searchPage;

            request.get({
                url: holdAPI,
                json: true,
                headers: {
                    "Content-Type": "application/json"
                }
            }, function(error, r, data){
                res.json(data);
            });

        })
    }
});

app.get('/recent', function(req, res) {
    UserSearches.find({}, function(err, doc){
        if(err)
            console.log(err);

        if(doc)
            res.send(doc);
        else
            res.send("list is empty")
    })
});

app.get('*', function (req, res) {
	res.send("error");
});

var server = app.listen(process.env.PORT || 8000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
