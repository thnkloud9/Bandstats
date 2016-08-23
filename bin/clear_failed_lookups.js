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

db.collection('bands').find().toArray(function(err, results) {
    if (err) throw err;

    var results = results;
    async.forEach(results, function(result, cb) {
        var facebookId = result.running_stats.facebook_likes.facebook_id;
        var bandId = result.band_id;
        var bandName = result.band_name;
        var updateQuery = { "band_id": result.band_id };
        var set = {
            $set: {
                "failed_lookups": {
                    "facebook": 0,
                    "lastfm": 0,
                    "echonest": 0 
                }
            }
        };
         
        db.collection('bands').update(updateQuery, set, function(err, result) {
            console.log('updated band_id ' + bandId);
        });
    },
    function (err) {
        console.log('done with update');
        process.exit(1);
    });
});
