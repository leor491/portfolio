'use strict';

var express = require('express');
var {body, param} = require('express-validator/check');
var router = express.Router();

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'mean',
	password : '54321',
	database : 'portfolio',
	//dateStrings: 'date'
	//dateStrings: true
});

connection.connect(function(err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}

	console.info('connected as id ' + connection.threadId);
});

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

router.get('/', function(req, res, next){
	connection.query("SELECT * FROM projects", function(err, projects){
		if (err){
			console.error(`Errors: ${JSON.stringify(err)}`);
			res.status(404).send();
		} else {
			res.render('admin/index', {projects});
		}
	});
});

router.get('/add', function(req, res, next){
	res.render('admin/add');
});

router.post('/add', upload.single('project_image'),
	[body("title", "Title field is required.").exists({checkFalsy: true}),
	body("service", "Service field is required.").exists({checkFalsy: true}),
	body("client", "Client field is required.").exists({checkFalsy: true}),
	body("description", "Description field is required.").exists({checkFalsy: true}),
	body("url", "URL field is invalid.").isURL({ protocols: ['http'], require_tld: true, require_protocol: true }),
	body('date', 'Project Date is an invalid date format').isISO8601('yyyy-mm-dd')],
	function(req, res, next){
		var {title, service, client, description, url, date} = req.body;
		var image = req.file ? req.file.filename : '';
		var errors = req.validationErrors();
		var project = {title, service, client, description, url, date, image};

		if (errors) {
			res.render('admin/add', {project, errors});
		} else {
			connection.query("INSERT INTO projects SET ?", project, function(err, result){
				if (err) {
					console.error(`Errors: ${JSON.stringify(err)}`);
					req.flash('errors', [{msg: "Project Not Added"}]);
					res.location('/admin/add');
					res.redirect('/admin/add');
				} else {
					console.info(`Result: ${JSON.stringify(result)}`);
					req.flash('success', 'Project Added');
					res.location('/admin');
					res.redirect('/admin');
				}
			});
		}
	});

router.get('/edit/:id',
	[param("id").isInt({min: 0})], 
	function(req, res, next){
		var {id} = req.params;
		var errors = req.validationErrors();

		if(errors){
			console.error(`Invalid value: ${JSON.stringify({errors})}`);
			res.location('/admin');
			res.redirect('/admin');
		} else{
			connection.query(
				"SELECT id, title, description, client, service, url, image, DATE_FORMAT(date, \"%Y-%m-%d\") as date FROM projects WHERE ?", 
				{id}, function(err, projects){
					if (err) {
						console.error(`Get Edit/ID Query Error: ${JSON.stringify(err)}`);
						res.location('/admin');
						res.redirect('/admin');
					} else if (!projects[0]) {
						console.error(`Errors: Project not found: ${req.params.id}`);
						res.location('/admin');
						res.redirect('/admin');
					} else {
						console.info(`Get Edit/ID Query Success: ${JSON.stringify(projects[0])}`);
						res.render('admin/edit', {errors: req.flash('errors'), project: projects[0]});
					}
				});
		}
	});

router.post('/edit/:id', upload.single('project_image'),
	[param("id").isInt({min: 0}),//test?
	body("title", "Title field is required.").exists({checkFalsy: true}),
	body("service", "Service field is required.").exists({checkFalsy: true}),
	body("client", "Client field is required.").exists({checkFalsy: true}),
	body("description", "Description field is required.").exists({checkFalsy: true}),
	body("url", "URL field is invalid.").isURL({ protocols: ['http'], require_tld: true, require_protocol: true }),
	body('date', 'Project Date is an invalid date format').isISO8601('yyyy-mm-dd')],
	function(req, res, next){
		var {id} = req.params;
		var {title, service, client, description, url, date} = req.body;

		var project = {id, title, service, client, description, url, date};
		var image = req.file ? req.file.filename : '';
		var errors = req.validationErrors();

		if (errors) {
			console.error(`Post Edit Project Validation Errors: ${JSON.stringify({project, errors})}`);
			res.render('admin/edit', {project, errors});
		} else {
			connection.query("UPDATE projects SET ? WHERE ?", 
				[{title, service, client, description, url, date, image}, {id}],
				function(err, projects){
					if (err) {
						console.error(`Post Edit Project Insert Errors: ${JSON.stringify(err)}`);
						var errors = [{msg: "Cannot Edit Project"}];
						res.render('admin/edit', {project, errors});		
					} else {
						console.info(`Post Edit Project Success: ${JSON.stringify(projects)}`);
						req.flash('success', 'Project Modified');
						res.location('/admin');
						res.redirect('/admin');
					}
				});
		}
	});

router.delete('/delete/:id',
	[param("id").isInt({min: 0})],
	function (req, res) {
		var errors = req.validationErrors();

		if (errors) {
			console.error(`Delete Project Validation Errors: ${JSON.stringify({errors})}`);
			res.render('admin/', {errors});
		} else {
			connection.query('DELETE FROM Projects WHERE id = ?', req.params.id, function (err, result) {
				if (err){
					console.error(`Cannot delete project: ${JSON.stringify(err)}`);
					//res.sendStatus(404);
				} else {
				console.info(`deleted ${result.affectedRows} rows`);
				res.sendStatus(200);
			}
		});
		}
	});

module.exports = router;