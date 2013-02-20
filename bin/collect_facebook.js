#!/usr/bin/env node
/**
 * command line utility to collect facebook graph statistics
 *
 * Author: Mark Lewis
 */

/**
 *  module requires
 */
var program = require('commander');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var nconf = require('nconf');

/**
 * config, db, and app stuff
 */
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});
var FacebookManager = require(path.join(__dirname, '/../app/lib/FacebookManager.js'));
var facebookManager = new FacebookManager();
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var bandRepository = new BandRepository({'db': db}); 

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-f, --facebook_id <facebook_id>', 'Facebook Id')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-f, --field <field_name>', 'Facebook Graph Field Id (example: likes, dscription, talking_about_count')

/**
 * update commands
 */
program
    .command('update')
    .description('gets new likes from facebook graph api and saves the value in mongo')
    .action(function() {
        var all_start = new Date().getTime();

        if (program.facebook_id) {
            var query = { 'external_ids.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } 

        if (query) {
            bandRepository.findOne(query, function(err, results) {
                if (err) throw err;

                if (results.band_id) {
                    var band_id = results.band_id;
                    var facebookId = results.external_ids.facebook_id;

                    facebookManager.getPageLikes(facebookId, function (err, likes) {
                        bandRepository.updateFacebookLikes({"band_id": band_id}, likes, function(err, results) {
                            console.log('updated band_id ' + band_id + ' with ' + likes + ' likes');
                            process.exit();
                        });
                    });
                }
            });
        } else {
            getAllFacebookLikes(function(err, processed) {
                var all_end  = new Date().getTime();
                console.log('getAllFacebookLikes took ' + (all_end - all_start) + ' milliseconds');
                process.exit();
            });
        }
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new likes from facebook graph api display, but does not save the value in mongo')
    .action(function() {
        if (program.facebook_id) {
            var query = { 'external_ids.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } else {
            console.log('you must use either lastfm_id, band_id, or band_name with view command');
            process.exit(1);
        }
        bandRepository.findOne(query, function(err, results) {
            if (err) throw err;

            if (results.band_id) {
                var band_id = results.band_id
                var facebookId = results.external_ids.facebook_id;

                facebookManager.getPageLikes(facebookId, function (err, likes) {
                    console.log('band_id ' + band_id + ' facebook_id ' + facebookId + ' likes ' + likes);
                    process.exit();
                });
            }
        });
    });

// process command line args
program.parse(process.argv);

/**
 * Function
 * TODO: move these to a lib 
 */
function getAllFacebookLikes(callback) {
    var query = {
        $and: [
            {"external_ids.facebook_id": { $ne: "" }},
            {"external_ids.facebook_id": { $ne: null }},
            {"band_id": { $ne: "" }}, 
        ]
    };
    var fields = { 
        "_id":0, 
        "band_id":1, 
        "band_name":1, 
        "external_ids":1 
    };

    db.collection('bands').find(query, {}, fields).toArray(function(err, results) {
        if (err) throw err;

        var processed = 0;
        var start = new Date().getTime(); 

        // make facebook graph api batches to avoid rate limit (600 request in 600 seconds)
        var batches = [];
        var requests = [];
        var count = 0;
        for (var r in results) {
            count++;
            var result = results[r];
            var facebookId = result.external_ids.facebook_id;
            var request = {
                "method": "GET",
                "relative_url": facebookId + "?fields=likes"
            };
            if (count < 50) {
                requests.push(request);
            } else {
                requests.push(request);
                batches.push(requests);
                requests = [];
                count = 0;
            } 
        }
        // push last request batch
        batches.push(requests);

        async.forEachSeries(batches, function(batch, scb) {
            // get likes 50 at a time
            facebookManager.getBatch(batch, function(err, results) {
                // update likes one at a time
                async.forEach(results, function(result, cb) {
                    if (!result) {
                        console.log(result);
                        cb('no result, wtf');
                        return false;
                    }
                    var body = JSON.parse(result.body);
                    var facebookId = body.id;
                    var query = {"external_ids.facebook_id": facebookId};
                    var likes = body.likes;
                    if (!facebookId) {
                        cb('no facebook id');
                        return false;
                    } 
                    bandRepository.updateFacebookLikes(query, likes, function(err, results) {
                        processed++;
                        console.log(facebookId + ' updated with ' + likes + ' likes');
                        cb(err, facebookId, likes);
                    });

                },
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                    scb();
                });
            });
        },
        function(err) {
            if (err) {
                console.log(err);
            }
            console.log('done with all batches');
            callback();
        });
    });
};

