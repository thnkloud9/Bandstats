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
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});


db.collection('counters').update({_id: "bands"}, {$set: { "seq": 0 }}, function(err, results) {
    if (err) util.log(err);

    console.log('done with update');
    process.exit(1);
});
