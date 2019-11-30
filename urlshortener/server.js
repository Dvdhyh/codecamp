var express = require("express");
var app = express();
var url = require("url");
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var uri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/heroku_1gsrzr8n";
var holdappURL = "https://ffc-urlshortener.herokuapp.com/";

app.use(express.static(__dirname));

app.get('/favicon.ico', function(req, res) {
    res.send("");
});

app.get("/", function(req, res){
	res.sendFile( __dirname + "/index.html" );
});


app.get("/new/*", function(req, res){
	var theURL = req.url.substring(5);
	var urlLength = theURL.length;

	if(urlLength == 0){
		res.send("URL length is invalid");
	}
	else{
		var searchURL = theURL.search(/(http)s{0,1}:\/\/[a-zA-Z]{0,}\.{1}[a-zA-Z]{1,}/);

		if(searchURL == -1){
			res.send("URL is invalid format");
		}
		else {

			MongoClient.connect(uri, {}, function(err, db){
				if(err) {
					console.log("Unable to connect to mongoDB server", err);
				}
				else {
					console.log("Connection established to ", uri);


					var myDB = db.collection("mycollects");
					
					//Find if URL already exist in DB
					myDB.find({
						original : theURL
					},{
						original: 1,
						shorten: 1,
						_id: 0
					}).toArray(function(err, docs){
						if(err){
							console.log("Error while finding item in data base", err);
						}
						else {
							
							if(docs.length == 0){
								var args = {};

								args["original"] = theURL;

								//Find the number of objects of DB
								myDB.count({}, function(err, indexSize){
									if(err){
										console.log("Error while counting collection size", err);
									}
									else {
										
										
										var arg2 = holdappURL +"get"+indexSize;
										args["shorten"] = arg2;

										//Insert URL into DB
										myDB.insert(args, function(err, data){
											if(err){
												console.log("Error while inserting ", err);
											}
											else{
												console.log("Insert successful");
												res.send(args);
												db.close();
											}
										});
										
										//res.send("" + indexSize);
										//db.close();
									}
								});
							}
							else{
								res.send(docs[0]);
							}
							
							
							//res.send(docs);
							//db.close();
						}
					});
				}
			});
		}
	}
});



app.get('/get*', function (req, res) {

	var theURL = "https://" + req.get("host") + req.url;

	MongoClient.connect(uri, {}, function(err, db){
		if(err) {
			console.log("Unable to connect to mongoDB server", err);
		}
		else {
			console.log("Connection established to ", uri);

			db.collection("mycollects").find({
				shorten : theURL
			}).toArray(function(err, docs){
				if(err){
					console.log("Error while finding ", err);
				}
				else {
					
					if(docs.length == 0){
						res.send("URL not found");
					}
					else{
						res.redirect(docs[0]["original"]);
					}
					
					db.close();
				}
			});
		}
	});
});





//Uses a JSON object to locally hold URL, if you don't want to use a database.
//data is lost when server shuts off
var localcontainer = {};

var checkArr = function(arr, val){
	for(var x in arr){
		if(arr[x] == holdappURL + val)
			return x;
	}
	return false;
}

app.get('/newlocal/*', function (req, res) {

    var theURL = req.url.substring(10);
	var urlLength = theURL.length;

	if(urlLength == 0){
		res.send("URL path is invalid");
	}
	else{

		var searchURL = theURL.search(/(http)s{0,1}:\/\/[a-zA-Z]{0,}\.{1}[a-zA-Z]{1,}/);

		if(searchURL == -1){
			res.send("URL has invalid format");
		}
		else {
			if(localcontainer[theURL] == undefined){

				var arg2 = holdappURL +"getlocal"+(Object.keys(localcontainer).length);
				localcontainer[theURL] = arg2;

				var data = {
					original : theURL,
					shorten : arg2
				}
				res.send( data );
			}
			else{
				res.send( {
					original : theURL,
					shorten : localcontainer[theURL]
				});
			}
		}
	}

	res.end();
});

app.get('/getlocal*', function (req, res) {

	var temp = checkArr(localcontainer, req.url.substring(1));

	if(temp == false){
		res.send("URL not found in local database");
	}
	else {
		res.redirect(temp);
		res.end();
	}
});

app.get("*", function(req, res){
	res.send("URL Error");
});


var port = process.env.PORT || 8000;

var server = app.listen(port, function () {
	var host = server.address().address
	var port = server.address().port

	console.log("Example app listening at http://%s:%s", host, port)
})
