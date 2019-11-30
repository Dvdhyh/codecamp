const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    User = require("./models/user.js"),
	expressSession = require("express-session"),
    hbars = require("express-handlebars"),
    handlebars = require('handlebars')
    path = require("path"),
    local = "mongodb://localhost/dbnightlife",
    heroku = process.env.MONGODB_URI;

mongoose.connect(heroku || local);

app.engine("hbs", hbars({extname:"hbs",
    defaultLayout:"layoutLoggedOut",
    layoutsDir:__dirname+"/views/layouts"}));
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'hbs');

handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSession({
    secret: "this is a secret string", //This is used to compute the hash (Can be anything)
    resave: false, // If true save everything, even if you didn't modify anything
    saveUninitialized: false // if true, session is stored to the session sotrage
}));

app.use(express.static(path.join(__dirname)));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: "SESSION_SECRET", resave: true, saveUninitialized: true }));

//handdle express passport twitter
require("./config/passportTwitter")(passport);
//handdle express passport local
require("./config/passportLocal")(passport);

app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  //res.locals.user = req.user || null;
  next();
});

app.get("/", function(req,res,next){
    if(req.user == null)
        res.render("getCity", {layout: "layoutLoggedOut.hbs"});
    else {
        res.render("getCity", {layout: "layoutLoggedIn.hbs"});
    }
});

let loginStuff = require("./routes/login.js")
let otherStuff = require("./routes/holdRoutes.js")
app.use('/l', loginStuff);
app.use('/r', otherStuff);

var port = 8000;

app.listen(process.env.PORT || port, function () {
  console.log('Example app listening on port 8000!');
});
