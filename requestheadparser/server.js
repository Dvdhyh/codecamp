var express = require('express');
var app = express();
				
app.route('/').get(function (req, res) {
	var varIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	 
	var varLang = req.headers["accept-language"];
	
	var varSoft = req.headers['user-agent'];
	
	var data = {
		"ipaddress":varIP,
		"language":varLang,
		"software":varSoft
	}
	res.send( data );
	//console.log(req.headers);
})

var port = process.env.PORT || 8000;

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})
