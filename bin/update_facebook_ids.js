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


db.collection('bands').find({"running_stats.facebook_likes.facebook_id": /\d+/}).toArray(function(err, results) {
    if (err) throw err;

    var results = results;
    async.forEach(results, function(result, cb) {
        if (result.running_stats.facebook_likes.facebook_id) {
            var facebookId = result.running_stats.facebook_likes.facebook_id;
            var bandName = result.band_name;
            var fbquery = { "running_stats.facebook_likes.facebook_id": facebookId };
            var set = {
                $set: {
                    "external_ids": [
                        { "facebook_id": facebookId },
                        { "lastfm_id": bandName },
                        { "musicbrainz_id": "" },
                        { "bandcamp_id": "" },
                        { "soundcloud_id": "" }
                    ]
                }
            };
             
            db.collection('bands').update(fbquery, set, function(err, result) {
                console.log('updated facebook_id ' + facebookId);
            });
        }
    },
    function (err) {
        console.log('done with update');
        process.exit(1);
    });
});
