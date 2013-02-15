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
var path = require('path');

/**
 * config, db, and app stuff
 */
var db = require('mongoskin').db('localhost:27017', {
  database: 'bandstats',
  safe: true,
  strict: false,
});
var LastfmManager = require(path.join(__dirname, '/../app/lib/LastfmManager.js'));
var lastfmManager = new LastfmManager();
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var bandRepository = new BandRepository({'db': db}); 

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
            var query = { 'external_ids.lastfm_id': program.lastfm_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        }

        if (query) {
            bandRepository.findOne(query, function(err, results) {
                if (err) throw err;

                if (results.band_id) {
                    var bandName = results.band_name;
                    var bandId = results.band_id;
                    var lastfmId = results.external_ids.lastfm_id;
                    lastfmManager.getListeners(lastfmId, function(err, listeners) {
                        bandRepository.updateLastfmListeners({ 'band_id': bandId }, listeners, function(err, results) { 
                            console.log('updated band_id ' + bandId  + ' with ' + listeners + ' listeners'); 
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
        bandRepository.findOne(query, function(err, results) {
            if (err) throw err;

            if (results.band_id) {
                var bandId = results.band_id;
                var lastfmId = results.external_ids.lastfm_id;

                lastfmManager.getListeners(lastfmId, function(err, listeners) {
                    console.log('band_id ' + band_id  + ' with ' + listeners + ' listeners'); 
                    process.exit(1);
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
        $and: [ 
            {"external_ids.lastfm_id": { "$ne" : ""}},
            {"external_ids.lastfm_id": { "$ne" : null}},
            {"band_id": { $ne: "" }},
        ]
    };
    var options = { 
        "_id":0, 
        "band_id":1, 
        "external_ids":1 
    };

    bandRepository.find(query, options, function(err, results) {
        if (err) throw err;

        var processed = 0;

        async.forEachSeries(results, function(result, scb) {
            async.waterfall([
                function(cb) {
                    var lastfmId = result.external_ids.lastfm_id;
                    var bandId = result.band_id;
                    lastfmManager.getListeners(lastfmId, function(err, listeners) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, bandId, listeners);
                    });
                },
                function(bandId, listeners, cb) {
                    if (listeners) {
                        bandRepository.updateLastfmListeners({'band_id': bandId}, listeners, function(err, results) {
                            if (err) {
                                cb(err);
                            }
                            cb(null, bandId, listeners); 
                        });
                    } else {
                        cb(null, bandId, 0);
                    }
                },
            ], 
            function (err, bandId, listeners) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('updated ' + bandId + ' with ' + listeners + ' listeners'); 
                }
                scb();
            });
        },
        function(err) {
            if (err) {
                console.log(err);
            }
            console.log('done with all');
            callback();
        });
    });
};

