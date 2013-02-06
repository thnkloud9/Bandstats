#!/usr/bin/env node
/**
 * command line utility to collect lastfm api statistics
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
    .option('-l, --lastfm_id <lastfm_ib>', 'Lastfm Id (usually same as band name)')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-f, --field <field_name>', 'Lastfm Api Field Id (example: artist.stats.listener, artist.stats.playcount, artist.bio')

/**
 * update commands
 */
program
    .command('update')
    .description('gets new value from lastfm api and saves the value in mongo')
    .action(function() {
        var all_start = new Date().getTime();

        // process single id
        if (program.lastfm_id) {
            var query = { 'running_stats.lastfm_listeners.lastfm_id': program.lastfm_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        }

        if (query) {
            getBand(query, function(err, results) {
                if (err) throw err;

                if (results[0].band_name) {
                    var band_id = results[0].band_name;
                    getLastfmListeners(program.lastfm_id, band_id, function(err, band_id, listeners) {
                        updateBandLastfmListeners(band_id, listeners, function(err, band_id, listeners) { 
                            console.log('updated band_id ' + band_id  + ' with ' + listeners + ' listeners'); 
                            process.exit(1);
                        });
                    });
                }
            });
        // else process for all
        } else {
            getAllLastfmListeners(function(err, processed) {
                var all_end  = new Date().getTime();
                console.log('processed ' + processed + ' bands');
                console.log('getAllLastfmListeners took ' + (all_end - all_start) + ' milliseconds');
                process.exit(1);
            });
        }
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new value from lastfm api and displays only, does not save the value in mongo')
    .action(function() {
        if (program.lastfm_id) {
            var query = { 'running_stats.lastfm_listeners.lastfm_id': program.lastfm_id };
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
                var band_id = results.band_id;
                var lastfm_id = results.running_stats.lastfm_listeners.lastfm_id;

                getLastfmListeners(lastfm_id, band_id, function(err, band_id, listeners) {
                    updateBandLastfmListeners(band_id, listeners, function(err, band_id, listeners) { 
                        console.log('updated band_id ' + band_id  + ' with ' + listeners + ' listeners'); 
                        process.exit(1);
                    });
                });
            }
        });
    });

// process command line args
program.parse(process.argv);

/**
 * Functions
 * TODO: move these to a LastFm module
 */
function getAllLastfmListeners(callback) {
    var query = { 
        "running_stats.lastfm_listeners.lastfm_id": {"$exists" : true, "$ne" : ""},
        "band_id": { $gt: "0" }, 
    };
    var fields = { 
        "_id":0, 
        "band_id":1, 
        "running_stats.lastfm_listeners.lastfm_id":1 
    };

    db.collection('bands').find(query, fields).toArray(function(err, results) {
        if (err) throw err;

        var processed = 0;
        for (var r in results) {
            var result = results[r];

            if (result.running_stats) {
                var lastfm_id = result.running_stats.lastfm_listeners.lastfm_id;
                var band_id = result.band_id;
                var start = new Date().getTime(); 

                // get the new lastfm listeners 
                getLastfmListeners(lastfm_id, band_id, function(err, band_id, listeners) {
                    if (err) {
                        processed++;
                        console.log('could not find listeners for band_id ' + band_id);
                    } else {
                        // update the band document
                        updateBandLastfmListeners(band_id, listeners, function(err, band_id, listeners) {
                            var end = new Date().getTime();
                            processed++;
                            if (processed == results.length) {
                                callback(null, processed);
                            } else {
                                console.log(processed + '(band_id ' + band_id + ') out of ' + results.length + ' took ' + (end - start) + ' milliseconds');
                            }
                        });
                    }
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

function getLastfmListeners(lastfm_id, band_id, callback) {
    var api_key = "e4d4f5353a13cf36fdb79957f831b6cf";
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfm_id + '&api_key=' + api_key + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (!err && response.statusCode == 200) {

            if (body.artist) {
                callback(null, band_id, body.artist.stats.listeners);
            } else {
                callback('could not find listeners for '+lastfm_id, band_id, null);
            }
        } else {
            callback(err);
        }
    });

};

function updateBandLastfmListeners(band_id, listeners, callback) {
    var query = { 'band_id': band_id };
    var today = moment().format('YYYY-MM-DD');
    var set = { $addToSet: {"running_stats.lastfm_listeners.daily_stats": { "date": today, "value": listeners } } };
   
    // add toays stat with upsert to overwrite in case it was already collected today
    db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
        var expire = moment().subtract('months', 6).calendar();
        var set = { $pull: {"running_stats.lastfm_listeners.daily_stats": { "date":  expire } } };
        // clean out any stats older than 6 months
        db.collection('bands').update(query, set, function(err, result) {
            callback(null, band_id, listeners);
        });
    });
};

