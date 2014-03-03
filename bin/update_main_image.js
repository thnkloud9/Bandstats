#!/usr/bin/env node
/**
 * command line utility to update the main image for bands
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
    .option('-l, --limit <num>', 'limit to <num> records')
    .option('-f, --force', 'force update (only updates empty or missing images if not using force)')

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
    .description('gets img src from resource api for display, but does not save the value in mongo')
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
    if (!program.provider) {
        util.log('you must provide provider option');
        process.exit(1);
    }

    if (program.band_id) {
        var query = { 'band_id': program.band_id };
    } else if (program.band_name) {
        var query = { 'band_name': program.band_name };
    } else { 
        var nullQuery = {};
        var emptyQuery = {};
        var nullImageQuery = {};
        var emptyImageQuery = {};
        var conditions = [];
        nullQuery['external_ids.' + program.provider + '_id'] = {$ne: null};
        emptyQuery['external_ids.' + program.provider + '_id'] = {$ne: ""};

        nullImageQuery['band_image_src'] = { $exists: false };

        conditions.push(nullQuery);
        conditions.push(emptyQuery);
        
        if (!program.force) {
            util.log('NOT IN FORCE MODE: only updating records without a band_image_src already');
            conditions.push(nullImageQuery);
        }

        query = {
            $and: conditions
        };
    }
    
    updateImages(save, query, program.provider, function(err, results) {
        if (err) {
            util.log('ERROR: ' + err);
        }
        util.log('done with all');
        updateJob(function() {
            process.exit();
        });
    });
}

function updateImages(save, query, provider, callback) {
    var lookupFunction = (provider == 'facebook') ? 'getPageImage' : 'getImage';

    util.log('starting image update using ' + lookupFunction);

    var options = {
        "band_id": 1,
        "band_name": 1,
        "_id": 0,
    };
    options['external_ids.' + provider + '_id'] = 1;

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
            util.log('adding ' + band.band_name + ' to the update list');

            var searchItem = {
                "band_id": band.band_id,
                "band_name": band.band_name,
                "search": band.external_ids[provider + '_id'],
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

            async.forEach(searchObj, function(result, rcb) {
                // call provider lookup
                var manager = eval(provider + 'Manager');
                var lookupFunction = (provider == 'facebook') ? 'getPageImage' : 'getImage';
                var parentLookup = eval(provider + 'Manager.' + lookupFunction);
                parentLookup.call(manager, result.search, function(err, results) {
                    if (err) {
                        // just skip and move on
                        return false;
                    }

                    // save results here
                    var bandId = result.band_id;
                    var bandName = result.band_name;
                    var search = result.search;
                    var imageSrc = results;

                    jobStats.processed++;

                    // save the record 
                    if (save) {
                        util.log('updating ' + bandName + ' using id ' + search + ' with ' + results);
                        bandRepository.update({"band_id": bandId}, {$set: { "band_image_src": results }}, {"multi": true}, function(err, updated) {
                            if (err) {
                                jobStats.errors++;
                                util.log(err); 
                            }

                            if (typeof value == "string") {
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
                            "band_image_src": results
                        }
                        console.log(output);
                        rcb();
                    }
                });
            },
            function (err, finalResult) {
                util.log('finished image updates');
                callback();
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

