#!/usr/bin/env node
/**
 * module requires
 */

var program = require('commander');
var request = require('request');
var async = require('async');
var path = require('path');
var util = require('util');
var nconf = require('nconf');
var BandRepository = require(path.join(__dirname, '/../app/repositories/BandRepository.js'));
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db("mongodb://"+nconf.get('db:host')+":"+ nconf.get('db:port') + "/" +  nconf.get('db:database'), {native_parser: true});
var bandRepository = new BandRepository({'db': db}); 
var jobRepository = new JobRepository({'db': db}); 
var processStart = new Date().getTime();
var processed = 0;
var jobStats = {
    "errors": 0,
    "processed": 0
};

var LastfmManager = require(path.join(__dirname, './../app/lib/LastfmManager.js'));
var lastfmManager = new LastfmManager();
var FacebookManager = require(path.join(__dirname, '/../app/lib/FacebookManager.js'));
var facebookManager = new FacebookManager();
var SpotifyManager = require(path.join(__dirname, './../app/lib/SpotifyManager.js'));
var spotifyManager = new SpotifyManager();
var EchonestManager = require(path.join(__dirname, './../app/lib/EchonestManager.js'));
var echonestManager = new EchonestManager();


/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-u, --url <url>', 'full url endpoint to get results from with http://...')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('update')
    .description('clears mentions array for given bands')
    .action(function() {

        if (!program.url) {
            console.log('you must provide url option');
            process.exit(1);
        }

        var all_start = new Date().getTime();
        var url = program.url;
        var finalResults = [];
        var options = {
            url: url,
            json: true 
        }

        request(options, function(err, response, body) {
            if (err) {
                util.log(err);
                process.exit(1);
            }
            
            async.forEach(body, function(band, cb) {
                var result = {
                    "band_id": band.band_id,
                    "band_name": band.band_name,
                    "duplicate": false,
                    "added": false
                };

                var query = {
                    $and: [
                        {"band_name": band.band_name},
                        {"regions": { $in: [ band.regions[0] ] } }, 
                        {"genres": { $in: [ band.genres[0] ] } }
                    ] 
                };
                
                // see if this band already exists
                bandRepository.find(query, {}, function(err, bandResults) {
                    // mark duplicate
                    if (bandResults.length > 0) {
                        jobStats.errors++;
                        util.log('duplicate ' + band.band_name);
                        result.duplicate = true;
                        finalResults.push(result);
                        cb(err);
                    } else {
                        // or add the band
                        jobStats.processed++;
                        util.log('adding ' + band.band_name);
                        bandRepository.insert(band, {}, function(err, insertResults) {
                            var newBand = insertResults[0];
                            result.added = true;
                            finalResults.push(result);
    
                            // lookeup external_ids if they are not provided, and lookup image
                            // (facebook_id, echonest_id, spotify_id, lastfm_id)
                            var searchArr = [];
                            var searchItem = {
                                "band_id": newBand.band_id,
                                "band_name": newBand.band_name,
                                "search": newBand.band_name
                            }
                            searchArr.push(searchItem); 
                            
                            // lookup missing external ids
                            async.waterfall([
                                // lastfm 
                                function(wcb) {
                                    if (newBand.external_ids.lastfm_id === "") {
                                        console.log('Looking up lastfm id for ' + newBand.band_name);
                                        lastfmManager.lookup(searchArr, 'search', function(err, results) {
                                            if (err) wcb(err);
                                            bandRepository.resolveLookups(results, 'lastfm', 'external_ids.lastfm_id', function(err, lastfmResults) {
                                                wcb(err);
                                            });
                                        });
                                    } else {
                                        wcb(null);
                                    }
                                },
                                // facebook
                                function(wcb) {
                                    if (newBand.external_ids.facebook_id === "") {
                                        console.log('Looking up facebook id for ' + newBand.band_name);
                                        facebookManager.lookup(searchArr, 'search', function(err, results) {
                                            if (err) wcb(err);
                                            bandRepository.resolveLookups(results, 'facebook', 'external_ids.facebook_id', function(err, facebookResults) {
                                                wcb(err);
                                            });
                                        });
                                    } else {
                                        wcb(null);
                                    }
                                },
                                // spotify 
                                function(wcb) {
                                    if (newBand.external_ids.spotify_id === "") {
                                        console.log('Looking up spotify id for ' + newBand.band_name);
                                        spotifyManager.lookup(searchArr, 'search', function(err, results) {
                                            if (err) wcb(err);
                                            bandRepository.resolveLookups(results, 'spotify', 'external_ids.spotify_id', function(err, spotifyResults) {
                                                wcb(err);
                                            });
                                        });
                                    } else {
                                        wcb(null);
                                    }
                                },
                                // echonest 
                                function(wcb) {
                                    if (newBand.external_ids.echonest_id === "") {
                                        console.log('Looking up echonest id for ' + newBand.band_name);
                                        echonestManager.lookup(searchArr, 'search', function(err, results) {
                                            if (err) wcb(err);
                                            bandRepository.resolveLookups(results, 'echonest', 'external_ids.echonest_id', function(err, echonestResults) {
                                                wcb(err);
                                            });
                                        });
                                    } else {
                                        wcb(null);
                                    }
                                }
                            ],
                            function(err) {
                                cb(err);
                            });
                        });
                    }
                });
            },
            function(err) {
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
                        console.log('done with all');
                        process.exit();
                    });
                } else {
                    console.log('done with all');
                    process.exit();
                }
            });
        });
    });

/**
 * view commands
 */
program
    .command('view')
    .description('not implemented')
    .action(function() {

        util.log('view not implemented');
        process.exit(1);
    });

// process command line args
program.parse(process.argv);


