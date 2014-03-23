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
var util = require('util');
var flash = require('connect-flash');
var passport = require('passport');
var SkinStore = require('connect-mongoskin');

/**
 * configuration
 */
nconf.file(path.join(__dirname, 'app/config/app.json'));

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
 * auth strategy
 */
var passport = require('passport');

/**
 * web server 
 */
var node_port = nconf.get('app:port');
var app = module.exports.app = express();
var sessionTimeout = nconf.get('app:session_timeout');
app.configure(function() {
    app.set('title', nconf.get('app:title'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());

    app.set("view options", { layout: false });
    //app.set('views', __dirname + '/app/views');

    // setup public folder
    app.use(express.static(__dirname + '/public'));

    // authentication and sessions
    app.use(flash());
    app.use(express.session({ secret: 'bandstats tracks', store: new SkinStore(db), cookie: { maxAge: sessionTimeout }})); // 30 minutes
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
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
require('./app/lib/Router.js').initRoutes(app, passport, db, jobScheduler);

/**
 * Start Server
 */
app.listen(node_port);
util.log(nconf.get('app:title') + ' listening on ' + nconf.get('app:port') + ' with ' + nconf.get('db:host') + ':' + nconf.get('db:port') + '/' + nconf.get('db:database') + ' database');

