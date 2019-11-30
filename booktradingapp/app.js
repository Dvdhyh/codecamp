var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    User = require("./models/user.js"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
	expressSession = require("express-session"),
    routes = require("./routes/holdRoutes.js"),
    hbars = require("express-handlebars"),
    handlebars = require('handlebars')
    path = require("path");

var local = "mongodb://localhost/members";
var heroku = process.env.MONGODB_URI;

mongoose.connect(heroku || local);

app.engine("hbs", hbars({extname:"hbs",
    defaultLayout:"layoutLoggedOut",
    layoutsDir:__dirname+"/views"}));
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
        case 'findStr':
            return (v1.indexOf(v2) != -1) ? options.fn(this) : options.inverse(this);
        case 'empty':
            return (v1.length == v2) ? options.fn(this) : options.inverse(this);
        case 'notempty':
            return (v1.length != v2) ? options.fn(this) : options.inverse(this);
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

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', routes);

var port = 8000;

app.listen(process.env.PORT || port, function () {
  console.log('Example app listening on port 8000!');
});
