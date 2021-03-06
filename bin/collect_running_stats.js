#!/usr/bin/env node
/**
 * command line utility to collect api statistics
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
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
var util = require('util');
var moment = require('moment');
var LastfmManager = require(path.join(__dirname, './../app/lib/LastfmManager.js'));
var SpotifyManager = require(path.join(__dirname, './../app/lib/SpotifyManager.js'));
var EchonestManager = require(path.join(__dirname, './../app/lib/EchonestManager.js'));
var FacebookManager = require(path.join(__dirname, '/../app/lib/FacebookManager.js'));
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));

/**
 * config, db, and app stuff
 */
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db("mongodb://"+nconf.get('db:host')+":"+ nconf.get('db:port') + "/" +  nconf.get('db:database'), {native_parser: true});
var bandRepository = new BandRepository({'db': db}); 
var jobRepository = new JobRepository({'db': db}); 
var facebookManager = new FacebookManager();
var lastfmManager = new LastfmManager();
var spotifyManager = new SpotifyManager();
spotifyManager.getSpotifyAccessToken(function(err) {
  if (err) util.log('Error getting spotify access token!');
});

var echonestManager = new EchonestManager();
var processStart = new Date().getTime();
var jobStats = {};

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-p, --provider <provider>', 'facebook, lastfm, echonest, soundcloud, bandcamp')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-r, --resource <resource>', 'a valid api provider function')
    .option('-f, --field <field_name>', 'band field name to store the values (example: facebook_likes, lastfm_listeners, etc)')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('update')
    .description('runs an api function for bands and saves the value in mongo')
    .action(function() {
        var save = true;
        start(save);
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new likes from facebook graph api display, but does not save the value in mongo')
    .action(function() {
        var save = false;
        start(save);
    });

// process command line args
program.parse(process.argv);

/**
 * Function
 * TODO: move these to a lib 
 */
function start(save) {
    if (!program.field || !program.provider || !program.resource) {
        util.log('you must provide provider, resoruce, and field options');
        process.exit(1);
    }

    if (program.band_id) {
        var query = { 'band_id': program.band_id };
    } else if (program.band_name) {
        var query = { 'band_name': program.band_name };
    } else { 
        var nullQuery = {};
        var emptyQuery = {};
        var conditions = [];
        nullQuery['external_ids.' + program.provider + '_id'] = {$ne: null};
        emptyQuery['external_ids.' + program.provider + '_id'] = {$ne: ""};

        conditions.push(nullQuery);
        conditions.push(emptyQuery);

        query = {
            $and: conditions
        };
    }
    
    collectRunningStats(save, query, program.provider, program.resource, program.field, function(err, results) {
        if (err) {
            util.log(err);
        }
        util.log('done with all');
        updateJob(function() {
            process.exit();
        });
    });
}

function collectRunningStats(save, query, provider, resource, runningStat, callback) {
    var lookupFunction = resource;
    var yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    var today = moment().format('YYYY-MM-DD');

    util.log('starting ' + runningStat + ' collection using ' + resource);

    var options = {
        "band_id": 1,
        "band_name": 1,
        "_id": 0,
    };
    options['external_ids.' + provider + '_id'] = 1;
    options['running_stats.' + runningStat + '.daily_stats'] = 1;

    if (program.limit) {
        options.limit = program.limit;
    }

    // loop through bands and make search object to send to lookups
    bandRepository.find(query, options, function(err, results) {
        var searchObj = [];

        if (err) {
            callback(err);
            return false;
        }
  
        // init job stats 
        jobStats.matched = results.length;
        jobStats.processed = 0;
        jobStats.errors = 0;
        jobStats.success = 0;
 
        // build searchObj
        async.forEach(results, function(band, cb) {
            var incrementalTotal = 0;
            var totalStats = 0;
            var maxLastValue = 0;

            // see if running_stat already exists
            if (band.running_stats[runningStat]) {
                var existingRunningStats = band.running_stats[runningStat].daily_stats;
                for (var s in existingRunningStats) {
                    var stat = existingRunningStats[s];
                    // if there is a stat from esterday, use it
                    if (stat.date == yesterday) {
                      var previous = stat.value;
                    }

                    // if we don't have a stat from yesterday, and the last marked stat is not from today, use it
                    if ((typeof previous === 'undefined')  && 
                        (stat.last == true) &&
                        (stat.date != today)) {
                      var previous = stat.value;
                    }
                    incrementalTotal += stat.incremental; 
                    totalStats++;
                    if ((stat.value > maxLastValue) && (stat.date != today)) {
                      maxLastValue = stat.value;
                    }
                }
            }

            // if there was no stat from yesterday, no stat marked last use:
            if (typeof previous === 'undefined') {
                if (totalStats > 0) {
                    // use the last max stat we have
                    var previous = maxLastValue;
                } else {
                    // or set to zero
                    var previous = 0;
                }
            }

            var searchItem = {
                "band_id": band.band_id,
                "band_name": band.band_name,
                "previous": previous,
                "total_stats": totalStats,
                "incremental_total": incrementalTotal,
                "search": band.external_ids[provider + '_id']
            };

            searchObj.push(searchItem);

            cb(null, searchObj);
        },
        function(err, results) {
            if (err) {
                // mark bad results here
                callback(err);
                return false;
            }

            // call facebook lookup
            var manager = eval(provider + 'Manager');
            var parentLookup = eval(provider + 'Manager.lookup');
            var lookupFunction = resource;
            parentLookup.call(manager, searchObj, lookupFunction, function(err, results) {
                if (err) {
                    callback(err);
                    return false;
                }

                // save results here
                async.forEach(results, function(result, rcb) {
                    var bandId = result.band_id;
                    var bandName = result.band_name;
                    var search = result.search;
                    var value = result.results;
                    var previous = result.previous;
                    var totalStats = result.total_stats;

                    // first collection gets 1 incremental to 
                    if ((totalStats < 1) || (typeof totalStats === 'undefined')) {
                        var incremental = 1;
                        var previous = parseInt(value) - 1;
                    } else {
                        if (parseInt(value) < parseInt(previous)) {
                            var incremental = 0;
                        } else {
                            // we SHOULD non have a non 0 previous here,
                            // if there is a problem with stats, dump previous here
                            // and see if its 0
                            var incremental = parseInt(value) - parseInt(previous); 
                        }
                    }
                    var totalStats = result.total_stats;
                    var incrementalTotal = parseInt(result.incremental_total) + incremental;
                    var incrementalAvg = Math.round(incrementalTotal / totalStats);

                    jobStats.processed++;

                    // save the record 
                    if (save) {
                        util.log('updating ' + bandName + ' using id ' + search + ' with ' + value + ' incr ' + incremental + ' prev ' + previous);
                        bandRepository.updateRunningStat(
                            {"band_id": bandId}, 
                            provider, 
                            runningStat, 
                            value, 
                            incremental, 
                            incrementalTotal, 
                            incrementalAvg, 
                            function(err, updated) {
                            if (err) {
                                jobStats.errors++;
                                util.log(err); 
                                // increase failed_lookups here
                                bandRepository.incrementFailedLookups({"band_id": bandId}, provider, function(failedErr, failedUpdated) {
                                    if (err) {
                                        console.log(failedErr);
                                    }
                                });
                            }

                            if (typeof value == "string") {
                                // this indicaates a bad external id
                                jobStats.errors++;
                                // increase failed_lookups here
                                bandRepository.incrementFailedLookups({"band_id": bandId}, provider, function(failedErr, failedUpdated) {
                                    if (err) {
                                        console.log(failedErr);
                                    }
                                });
                            } else {
                                jobStats.success++;
                            }
                            rcb(null, updated);
                        });
                    } else {
                        var output = {
                            "band_id": bandId,
                            "band_name": bandName,
                            "value": value,
                            "incremental": incremental,
                            "incremental_total": incrementalTotal,
                            "incremental_avg": incrementalAvg,
                            "total_stats": totalStats 
                        }
                        console.log(output);
                        rcb();
                    }
                },
                function (err, finalResult) {
                    util.log('finished ' + runningStat + ' collection database updates');
                    callback();
                });
            });
        });
    });
}

function updateJob(callback) {
    var processEnd = new Date().getTime();
    var duration = (processEnd - processStart);
    if (program.job_id) {
        var query = {"job_id": program.job_id};
        var values = {
            $set: {
                "job_processed": jobStats.processed,
                "job_failed": jobStats.errors,
                "job_last_run": new Date(),
                "job_duration": duration
            }
        }
        jobRepository.update(query, values, function(err, result) {
            callback(err, result);
        });
    } else {
        callback();
    }
} 

