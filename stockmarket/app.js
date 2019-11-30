const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const path = require('path');
const request = require("request");
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(bodyParser.urlencoded({extended:false}));
var port = process.env.PORT || 8000;
var mongoURI = process.env.MONGODB_URI || "localhost:27017/stocks";

mongoose.connect(mongoURI);
var Schema = mongoose.Schema;

const stockSchema = new Schema({
    holdArray: Array
}, {collection: 'mystocks'});

var myData = mongoose.model("myData", stockSchema);

var data;

//Allows static files to be called (Needed for mycss.css to be called in the html file)
app.use("/", express.static(__dirname+"/"));

//Load the page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

/// Get JSON data from company symbol
var getStockAPI = function(symbol){

    var getDays = 365;
    var setTicks = 12; //12 months plus 1 extra

    let param = {
        Normalized: false,
        NumberOfDays: getDays,
        DataPeriod: "Day",
        Elements : [{Symbol: symbol, Type: "price", Params: ["ohlc"]}]
    }

    var stockURL = "http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters="+JSON.stringify(param);

    //Receive json data from server side using "request"
    request.get({
        url: stockURL,
        json: true,
        headers: {
            "Content-Type": "application/json"
        }
    }, function(error, res, body){
        if (error)
            return false;

        //Body returns: SUCCESS object - FAIL string "String says Site Error"
        if(typeof(body) == typeof({})){
            //console.log(body);
            io.emit('getStockData', symbol, body, getDays, setTicks);
        }else {

            //Remove symbol from database
            var tempIndex = data.holdArray.indexOf(symbol);

            if(tempIndex != -1){
                data.holdArray.splice(tempIndex, 1);
                data.save();

                io.emit('delete stock', symbol, data.holdArray);
            }
        }
    });
}

//server, waiting for socket connections(clients)
io.on('connection', function(socket){

    //Set up the page with values stored in database
    myData.count({}, function(err, c){
        //If none exist, than create an empty collection
        if(c == 0){
            data = new myData({holdArray:["goog"]});
            data.save();
        }


        //Grab the collection
        myData.find().then(function(doc){
            data = doc[0];

            //Pass data structure to "getList" packet
            io.emit('getList', data.holdArray);

            for(var i = 0; i < data.holdArray.length; ++i){

                //Grab JSON data for each company symbol in database
                getStockAPI(data.holdArray[i]);
            }
        });
    });

    //Receive from Client to "Add event"
    socket.on('insert stock', function(symbol){

        //Grab symbol from input and save to db
        data.holdArray.push(symbol);
        data.save();

        //Pass the symbol to all open sockets
        io.emit('insert stock', data.holdArray);

        //Call JSON function
        getStockAPI(symbol);
    });

    //Receive from client "removal event"
    socket.on('delete stock', function(msg){
        var temp = data.holdArray.indexOf(msg);

        if(temp != -1){
            data.holdArray.splice(temp, 1);
            data.save();

            io.emit('delete stock', msg, data.holdArray);
        }
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
