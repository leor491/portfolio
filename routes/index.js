'use strict';

var express = require('express');
var router = express.Router();
var {param} = require('express-validator/check');

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'mean',
	password : '54321',
	database : 'portfolio'
});

connection.connect(function(err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}

	console.info('connected as id ' + connection.threadId);
});

router.get('/', function(req, res, next){
	connection.query("SELECT * FROM projects", function(err, projects){
		if (err){
			console.error(`Errors: ${JSON.stringify(err)}`);
			res.status(404).send();
		} else {
			res.render('index', {projects, errors: req.flash("errors")});
		}
	});
});

router.get('/details/:id',
	[param("id").isInt({min: 0})],
	function(req, res, next){
		var errors = req.validationErrors();
		if(errors){
			console.error(`Invalid value: ${JSON.stringify({errors})}`);
			res.location('/');
			res.redirect('/');
		} else{
			connection.query("SELECT title, image, client, DATE_FORMAT(date, \"%M %d, %Y\") as date, service, description, url FROM projects WHERE ?", 
				{id: req.params.id}, function(err, projects){
					if (err){
						console.error(`Errors: ${JSON.stringify(err)}`);
						res.location('/');
						res.redirect('/');
					} else if (!projects[0]) {
						console.error(`Errors: Project not found: ${req.params.id}`);
						res.location('/');
						res.redirect('/');
					} else {
						res.render('details', {project: projects[0]});
					}
				});
		}
	});

module.exports = router;