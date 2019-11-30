var express = require('express');
var app = express();
var fs = require('fs');
var multer  = require('multer');

app.use(express.static(__dirname));

var upload = multer({ dest: '/tmp/'});

app.get("/", function(req, res){
	res.sendFile( __dirname + "/index.html" );
});


app.post('/file_upload', upload.single("theFile"), function (req, res) {

	var file = __dirname + "/" + req.file.filename;
   
	fs.readFile( req.file.path, function (err, data) {
		fs.writeFile(file, data, function (err) {
			if( err ){
				console.log( err );
            }else{
				response = {
					message:'File uploaded successfully',
					filesize:req.file.size
				};
				
				console.log( response );
				res.end( JSON.stringify( response ) );
            }
		});
	});
});

var port = process.env.PORT || 8000;

var server = app.listen(port, function () {
	var host = server.address().address
	var port = server.address().port

	console.log("Example app listening at http://%s:%s", host, port)
})