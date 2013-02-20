#!/usr/bin/env node

/**
 * Bandstats app server
 *
 * author: Mark Lewis
 */

/**
 * requires
 */
var nconf = require('nconf');
var express = require('express');
var fs = require('fs');
var path = require('path');

require("jinjs").registerExtension(".jinjs");

/**
 * Configuration
 */
nconf.file(path.join(__dirname, 'app/config/app.json'));

/**
 * web server 
 */
var node_port = nconf.get('app:port');
var app = module.exports.app = express()
app.configure(function() {
    app.set('title', nconf.get('app:title'));
    app.use(express.bodyParser());

    // use jinjs for templates
    //app.set("view options", { jinjs_pre_compile: function (str) { return parse_pwilang(str); } });
    app.set('view engine', 'jinjs');
    app.set("view options", { layout: false });
    app.set('views', __dirname + '/app/views');

    // setup public folder
    app.use(express.static(__dirname + '/public'));
})

/**
 * database
 */
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});

/**
 * Load the JobSchedule
 */
var JobScheduler = require('./app/lib/JobScheduler.js');
var jobScheduler = new JobScheduler(db);
jobScheduler.initSchedule();

/**
 * Load Router, which will autoload additional
 * controllers in app/controllers
 */
require('./app/lib/Router.js').initRoutes(app, db, jobScheduler);

/**
 * Start Server
 */
app.listen(node_port);
console.log(nconf.get('app:title') + ' listening on ' + nconf.get('app:port') + ' with ' + nconf.get('db:host') + ':' + nconf.get('db:port') + '/' + nconf.get('db:database') + ' database');

