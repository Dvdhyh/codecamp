const express = require('express'),
    mongoose = require('mongoose'),
    passport = require("passport"),
    router = express.Router(),
    request = require("request")

require("dotenv/config");

const googleKey = process.env.M_GOOGLE_MAP_API || process.env.GOOGLE_MAP_API;

var holdCity = require("../models/holdCity.js");
var User = require("../models/user.js");

// register post
router.post("/enterCityForm", function(req,res,next){

    let pickLayout = "layoutLoggedOut.hbs"
    if(req.isAuthenticated()){
        pickLayout = "layoutLoggedIn.hbs";
    }

    var tempCity = req.body.theCity;

    holdCity.findOne({"city":tempCity}, function(err, doc){

        if(err)
            return res.status(500).send({error: err});

        //if city hasn't been saved
        if(doc != null){
            res.render("allVenues", {layout: pickLayout, hbsVar:doc});
        }
        else {
            //API call to grab lat and long from city name
            var getLatLong= "https://maps.googleapis.com/maps/api/geocode/json?address=" + tempCity + "&key=" + googleKey;

            request.get({
                url: getLatLong,
                json:true,
                headers:{
                    "Content-type":"application/json"
                }
            }, function(error, r, data){

                //If City name is not found
                if(data.status != "OK"){
                    res.redirect("/");
                }
                else{
                    //Get venues from lcations
                    var getLatLong= "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + data.results[0].geometry.location.lat+","+data.results[0].geometry.location.lng+"&radius=5000&type=restaurant&key=" + googleKey;

                    request.get({
                        url: getLatLong,
                        json:true,
                        headers:{
                            "Content-type":"application/json"
                        }
                    }, function(error, r1, data1){

                        //If City name is not found
                        if(data.status != "OK"){
                            res.redirect("/");
                        }
                        else{

                            let tempVenues = [];

                            for(let i of data1.results){
                                let temp = {};
                                temp["name"] = i.name.toUpperCase();
                                temp["attendence"] = 0;
                                temp["id"] = i.place_id;
                                temp["address"] = i.vicinity;
                                tempVenues.push(temp);
                            }

                            let tempDoc = {
                                city: tempCity,
                                venues: tempVenues
                            }

                            let newSave = new holdCity(tempDoc);

                            newSave.save();
                            res.render("allVenues", {layout: pickLayout, hbsVar:tempDoc});
                        }
                    })

                }
            })

        }
    })
});

//if the going form button is clicked
router.post("/attendForm", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }

    let getCityName = req.body.cityName;

    res.redirect("../l/twitterLogin");

}, function(req, res) {

    let getCityId = req.body.cityId;
    let getCityName = req.body.cityName;

    //Add the change to the location attendence
    User.findOne({"username":req.user.username}, function(err, doc){

        if(err)
            return res.status(500).send({error: err});

        let changeNum = 0;

        if(doc.goList.length == 0){
            doc.goList.push(getCityId);
            changeNum = 1;
        }
        else {
            for(let i=0; i < doc.goList.length; i++){

                //If you already voted, remove 1
                if(doc.goList[i] == getCityId){
                    doc.goList.splice(i, 1);
                    changeNum = -1;
                    break;
                }
            }
            //Increase number by 1
            if(changeNum == 0){
                doc.goList.push(getCityId);
                changeNum = 1;
            }
        }

        doc.save()

        //Increment / decrement voting number system
        holdCity.findOneAndUpdate({"city":getCityName, "venues.id":getCityId}, {$inc: {"venues.$.attendence":changeNum}}, {new: false}, function(err, doc1){
            if(err)
                return res.status(500).send({error: err});

            for(let i=0; i < doc1.venues.length; i++){
                if(doc1.venues[i].id == getCityId){
                    doc1.venues[i].attendence += changeNum;
                    break;
                }
            }

            doc1.save();

            res.render("allVenues", {layout: "layoutLoggedIn.hbs", hbsVar:doc1});
        })

    })

});

//List all Image
router.get("/allVenues", function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("allVenues", {layout: "layoutLoggedOut.hbs"});
}, function(req, res) {

    res.render("allVenues", {layout: "layoutLoggedIn.hbs", hbsVar:temp});
});



router.get("favicon.ico"), function(req, res){
    res.sendStatus(204);
}

module.exports = router;
