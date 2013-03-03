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
var passport = require('passport');

require("jinjs").registerExtension(".jinjs");

/**
 * Configuration
 */
nconf.file(path.join(__dirname, 'app/config/app.json'));

/**
 * auth strategy
 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
    */
    return done(null, {"username": "fake_admin"});
  }
));

/**
 * web server 
 */
var node_port = nconf.get('app:port');
var app = module.exports.app = express()
app.configure(function() {
    app.set('title', nconf.get('app:title'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());

    // use jinjs for templates
    //app.set("view options", { jinjs_pre_compile: function (str) { return parse_pwilang(str); } });
    app.set('view engine', 'jinjs');
    app.set("view options", { layout: false });
    app.set('views', __dirname + '/app/views');

    // setup public folder
    app.use(express.static(__dirname + '/public'));

    // authentication and sessions
    app.use(express.session({ secret: 'bandstats tracks'}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
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
util.log(nconf.get('app:title') + ' listening on ' + nconf.get('app:port') + ' with ' + nconf.get('db:host') + ':' + nconf.get('db:port') + '/' + nconf.get('db:database') + ' database');

