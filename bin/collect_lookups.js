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
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
var SoundcloudManager = require(path.join(__dirname, './../app/lib/SoundcloudManager.js'));
var LastfmManager = require(path.join(__dirname, './../app/lib/LastfmManager.js'));
var SpotifyManager = require(path.join(__dirname, './../app/lib/SpotifyManager.js'));
var EchonestManager = require(path.join(__dirname, './../app/lib/EchonestManager.js'));
var FacebookManager = require(path.join(__dirname, '/../app/lib/FacebookManager.js'));
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));
var BandstatsUtils = require(path.join(__dirname, '/../app/lib/BandstatsUtils.js'));

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
var spotifyManager = new SpotifyManager();
var echonestManager = new EchonestManager();
var soundcloudManager = new SoundcloudManager();
var bandstatsUtils = new BandstatsUtils();

var processStart = new Date().getTime();

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
    .option('-l, --limit <num>', 'limit the lookup to <num> records')
    .option('-e, --error_threshold <num>', 'limit the lookup to bands with LESS THAN <num> errors');

/**
 * update commands
 */
program
    .command('update')
    .description('runs an api function for bands and saves the value in mongo')
    .action(function() {
        var all_start = new Date().getTime();

        if (!program.field || !program.provider || !program.resource) {
            console.log('you must provide provider, resoruce, and field options');
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
            nullQuery[program.field] = null;
            emptyQuery[program.field] = "";

            conditions.push(nullQuery);
            conditions.push(emptyQuery);

            if (program.error_threshold > 0) {
                var errorLimit = parseInt(program.error_threshold);
                var errorQuery = {};
                errorQuery["failed_lookups." + program.provider] = { $lt: errorLimit }

                query = {
                    $and: [errorQuery],
                    $or: conditions
                };
            } else {
                query = {
                    $or: conditions
                };
            }
        }

        collectLookups(query, program.provider, program.resource, program.field, function(err, results) {
            if (err) {
                console.log(err);
            }
            var processEnd = new Date().getTime();
            var duration = (processEnd - processStart);
            if (program.job_id) {
                var query = {"job_id": program.job_id};
                var values = {
                    $set: {
                        "job_last_run": new Date(),
                        "job_duration": duration
                    }
                }
                jobRepository.update(query, values, function(err, result) {
                    console.log('done with all');
                    process.exit();
                });
            } else {
                console.log('done with all');
                process.exit();
            }
        })
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new likes from facebook graph api display, but does not save the value in mongo')
    .action(function() {

        console.log('view not implemented');
        process.exit(1);
    });

// process command line args
program.parse(process.argv);

function collectLookups(query, provider, resource, bandField, callback) {

    var options = {
        "band_id": 1,
        "band_name": 1,
        "_id": 0,
    };

    if (program.limit) {
        options.limit = program.limit;
    }

    bandRepository.find(query, options, function(err, results) {
        var searchObj = [];

        if (err) {
            console.log({"status": "error", "error": err});
            return false;
        }
    
        // build searchObj
        async.forEach(results, function(band, cb) {
            var searchItem = {
                "band_id": band.band_id,
                "band_name": band.band_name,
                "search": band.band_name
            };

            if (band.band_name != "") {
                searchObj.push(searchItem);
            }

            cb(null, searchObj);
        },
        function(err, results) {
            if (err) {
                // mark bad results here
                console.log(err);
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

                console.log('finished ' + bandField + ' collection using ' + resource);
                
                bandRepository.resolveLookups(results, provider, bandField, function(err, finalResults) {
                    console.log('finished ' + bandField + ' collection database updates');
                    callback(err, finalResults);
                });

            });
        });
    }); 
}
