#!/usr/bin/env node
/**
 * module requires
 */

//var program = require('commander');
var request = require('request');
var async = require('async');
var moment = require('moment');
var path = require('path');
var nconf = require('nconf');
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db("mongodb://"+nconf.get('db:host')+":"+ nconf.get('db:port') + "/" +  nconf.get('db:database'), {native_parser: true});

db.collection('bands').remove(function(err, results) {
    if (err) util.log(err);

    console.log('done with update');
    process.exit(0);
});
