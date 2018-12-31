'use strict';

var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var session = require('express-session');
var flash = require('connect-flash');
var logger = require('morgan');
var multer = require('multer');
var upload = multer({destination: './public/images/portfolio'});

//express
var app = express();

//port
app.set('port', process.env.PORT || 3000);

//morgan
app.use(logger('dev'));

//Routers
var index = require('./routes/index');
var admin = require('./routes/admin');

//Body Parser
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//Express Sessions
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

//Express Validation
app.use(expressValidator({
	errorFormatter: function(param, msg, value){
		var namespace = param.split('.');
		var root = namespace.shift();
		var formParam = root;

		while(namespace.length){
			formParam += `[${namespace.shift()}]`;
		}

		return {
			param: formParam,
			msg,
			value
		};
	}
}));

//Static Files
app.use(express.static(path.join(__dirname, 'public')));

//mount uploads
app.use('/avatar', express.static(path.join(__dirname, 'uploads')));

//View Engine
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));

//Connect-Flash
app.use(flash());

//Use Routers
app.use('/', index);
app.use('/admin', admin);

app.listen(app.get('port'));
console.log(`Listening on port ${app.get('port')}`);

