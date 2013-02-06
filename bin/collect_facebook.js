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
var moment = require('moment');
var nconf = require('nconf');
var db = require('mongoskin').db('localhost:27017', {
  database: 'bandstats',
  safe: true,
  strict: false,
});

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
            var query = { 'running_stats.facebook_likes.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } 

        if (query) {
            getBand(query, function(err, results) {
                if (err) throw err;

                if (results.band_id) {
                    var band_id = results.band_id
                    var facebook_id = results.running_stats.facebook_likes.facebook_id
                    getFacebookLikes(facebook_id, band_id, function (err, band_id, likes) {
                        updateBandFacebookLikes(band_id, likes, function(err, band_id, likes) {
                            console.log('updated band_id ' + band_id + ' with ' + likes + ' likes');
                            process.exit(1);
                        });
                    });
                }
            });
        } else {
            getAllFacebookLikes(function(err, processed) {
                var all_end  = new Date().getTime();
                console.log('processed ' + processed + ' bands');
                console.log('getAllFacebookLikes took ' + (all_end - all_start) + ' milliseconds');
                process.exit(1);
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
            var query = { 'running_stats.facebook_likes.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } else {
            console.log('you must use either lastfm_id, band_id, or band_name with view command');
            process.exit(1);
        }
        getBand(query, function(err, results) {
            if (err) throw err;

            if (results.band_id) {
                var band_id = results.band_id
                var facebook_id = results.running_stats.facebook_likes.facebook_id

                getFacebookLikes(facebook_id, band_id, function (err, band_id, likes) {
                    console.log('band_id ' + band_id + ' facebook_id ' + facebook_id + ' likes ' + likes);
                    process.exit(1);
                });
            }
        });
    });

// process command line args
program.parse(process.argv);

/**
 * Function
 * TODO: move these to modules
 */
function getAllFacebookLikes(callback) {
    var query = { 
        "running_stats.facebook_likes.facebook_id": { $gt: "0" },
        "band_id": { $gt: "0" }, 
    };
    var fields = { 
        "_id":0, 
        "band_id":1, 
        "running_stats.facebook_likes.facebook_id":1 
    };

    db.collection('bands').find(query, fields).toArray(function(err, results) {
        if (err) throw err;

        var processed = 0;
        for (var r in results) {
            var result = results[r];

            if (result.running_stats) {
                var facebook_id = result.running_stats.facebook_likes.facebook_id;
                var band_id = result.band_id;
                var start = new Date().getTime(); 

                // get the new facebook likes
                getFacebookLikes(facebook_id, band_id, function(err, band_id, likes) {
                    // update the band document
                    updateBandFacebookLikes(band_id, likes, function(err, band_id, likes) {
                        var end = new Date().getTime();
                        processed++;
                        if (processed == results.length) {
                            callback(null, processed);
                        } else {
                            console.log(processed + ' out of ' + results.length + ' took ' + (end - start) + ' milliseconds');
                        }
                    });
                });
            }
        }
    });
};

function getBand(query, callback) {
    db.collection('bands').find(query).toArray(function(err, results) {
        if (err) throw err;
       
        if (results.length > 1) {
            callback('more than one band matched', results);
        } else { 
            callback(null, results[0]);
        }
    });
}

function getFacebookLikes(facebook_id, band_id, callback) {
    var options = { 
        url: 'http://graph.facebook.com/' + facebook_id,
        json: true
    };

    request(options, function (err, response, body) {
        if (!err && response.statusCode == 200) {

            if (body.likes) {
                callback(null, band_id, body.likes);
            } else {
                callback('could not find likes for band_id ' + band_id, band_id, null);
            }
        } else {
            callback(err);
        }
    });

};

function updateBandFacebookLikes(band_id, likes, callback) {
    var query = { 'band_id': band_id };
    var today = moment().format('YYYY-MM-DD');
    var set = { $addToSet: {"running_stats.facebook_likes.daily_stats": { "date": today, "value": likes } } };
   
    // add toays stat with upsert to overwrite in case it was already collected today
    db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
        var expire = moment().subtract('months', 6).calendar();
        var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  expire } } };
        // clean out any stats older than 6 months
        db.collection('bands').update(query, set, function(err, result) {
            callback(null, band_id, likes);
        });
    });
   
};

