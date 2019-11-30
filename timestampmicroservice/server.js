var express = require('express');
var app = express();
var url = require("url");

var holdMonth = ["January","February", "March", "April", "May", "June", 
				"July", "August", "September", "October", "November", "December"]

app.use(express.static(__dirname));
				
app.get('/', function (req, res) {
   res.sendFile( __dirname + "/index.html" );
   
   //res.render("index");
})

app.get('*', function (req, res) {
    var arg1 = null;
    var arg2 = null;
    
    var time1 = url.parse(req.url).path.substring(1);
    
	var search1 = time1.search(/[^0-9]+/)
	
	if(search1 == -1){			
		var unixT = new Date(time1*1000)
		
		var naturalT = holdMonth[unixT.getMonth()]+" "+unixT.getDate()+", "+unixT.getFullYear()

		arg1 = time1
		arg2 = naturalT
	}else{		
		var unixT = new Date(time1)
		
		if(!isNaN(unixT)){
			
			var naturalT = holdMonth[unixT.getMonth()]+" "+unixT.getDate() +", "+unixT.getFullYear()
			
            unixT = Date.parse(time1)/1000
            
    		arg1 = unixT
    		arg2 = naturalT 
		}
	}
    
    var data = {
        unix : arg1,
        natural : arg2
    }
   res.send( data );
})

var port = process.env.PORT || 8000;

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})
