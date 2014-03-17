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
var EchonestManager = require(path.join(__dirname, './../app/lib/EchonestManager.js'));
var FacebookManager = require(path.join(__dirname, '/../app/lib/FacebookManager.js'));
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));

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
var bandRepository = new BandRepository({'db': db}); 
var jobRepository = new JobRepository({'db': db}); 
var facebookManager = new FacebookManager();
var lastfmManager = new LastfmManager();
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

function sanitizeSearchString(text) {
    sanitized_text = text.toLowerCase();
    sanitized_text = sanitized_text.replace('&', 'and')
        .replace(/[\+\,\.\?\!\-\;\:\'\(\)]+/g, '')
        .replace(/[\"“\'].+[\"”\']/g, '')
        .replace(/[\n\r]/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/[\\\/]/g, '');
 
    return sanitized_text;
}

function collectRunningStats(save, query, provider, resource, runningStat, callback) {
    var lookupFunction = resource;
    var yesterday = moment().subtract('days', 1).format('YYYY-MM-DD');

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
            // find yesterdays stat
            var previous = 0;
            var incrementalTotal = 0;
            var totalStats = 0;

            // see if we running_stat already exists
            if (band.running_stats[runningStat]) {
                var existingRunningStats = band.running_stats[runningStat].daily_stats;
                for (var s in existingRunningStats) {
                    var stat = existingRunningStats[s];
                    if (stat.date == yesterday) {
                       previous = stat.value;
                    }
                    incrementalTotal += stat.incremental; 
                    totalStats++;
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

                util.log('finished ' + runningStat + ' collection using ' + resource);

                // save results here
                async.forEach(results, function(result, rcb) {
                    var bandId = result.band_id;
                    var bandName = result.band_name;
                    var search = result.search;
                    var value = result.results;
                    var previous = result.previous;
                    var totalStats = result.total_stats;
                    var incrementalTotal = result.incremental_total;
                    var incremental = parseInt(value) - parseInt(previous);
                    incrementalTotal += incremental;
                    var incrementalAvg = Math.round(incrementalTotal / totalStats);

                    jobStats.processed++;

                    // save the record 
                    if (save) {
                        util.log('updating ' + bandName + ' using id ' + search + ' with ' + value);
                        bandRepository.updateRunningStat({"band_id": bandId}, runningStat, value, incremental, incrementalTotal, incrementalAvg, function(err, updated) {
                            if (err) {
                                jobStats.errors++;
                                util.log(err); 
                            }

                            if (typeof value == "string") {
                                // this indicaates a bad external id
                                jobStats.errors++;
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

