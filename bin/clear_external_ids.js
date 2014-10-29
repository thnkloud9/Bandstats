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


db.collection('bands').find().toArray(function(err, results) {
    if (err) throw err;

    var results = results;
    async.forEach(results, function(result, cb) {
        var bandId = result.band_id;
        var bandName = result.band_name;
        var updateQuery = { "band_id": result.band_id };
        var set = {
            $set: {
                "external_ids": {
                    "facebook_id": "",
                    "lastfm_id": bandName,
                    "musicbrainz_id": "",
                    "bandcamp_id": "",
                    "soundcloud_id": "",
                    "echonest_id": "" 
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
