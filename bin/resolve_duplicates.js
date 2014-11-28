#!/usr/bin/env node
/**
 * module requires
 */

var program = require('commander');
var request = require('request');
var async = require('async');
var moment = require('moment');
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
var jobStats = {
    "errors": 0,
    "processed": 0
};

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('update')
    .description('attempts to resolve duplicate band records')
    .action(function() {

        if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } else {
	        var query = {};
        }

        var sort = {
            band_name: 1
        }

        bandRepository.findDuplicates(query, sort, null, null, function (err, bands, total) {
            if (err) throw err;

            var duplicateBands = bands;
            var previousBand = {};
            async.forEach(duplicateBands, function(band, cb) {
                if (typeof previousBand.band_name === 'undefined') {
                    previousBand = band;
                    cb();
                    return false;
                }
                if ((band.band_name == previousBand.band_name) &&
                    (band.genres.toString() == previousBand.genres.toString())) {
                    if (band.regions.toString() == previousBand.regions.toString()) {
                        // delete real dupes
                        util.log(band.band_name + ' ' + band.band_id + ' ' + previousBand.band_id + ' are identical');
                        util.log('deleting ' + band.band_name + ' ' + band.band_id);
                        bandRepository.remove({'band_id': band.band_id}, {multi: true}, function(err, bands) {
                            if (err) jobStats.errors++;
                            previousBand = band;
                            jobStats.processed++;
                            cb();
                            return true;
                        });
                    } else {
                        // add extra region to existing band
                        for (var r in band.regions) {
                            var newRegion = band.regions[r];
                            if (previousBand.regions.indexOf(newRegion) < 0) {
                                util.log('adding ' + newRegion + ' to ' + previousBand.band_name + ' ' + previousBand.band_id); 
                                previousBand.regions.push(newRegion); 
                            }
                            bandRepository.update({'band_id': previousBand.band_id}, { $set: { regions: previousBand.regions }}, {}, function (err, bands) {
                                if (err) jobStats.errors++;
                                util.log('deleting ' + band.band_name + ' ' + band.band_id);
                                bandRepository.remove({'band_id': band.band_id}, {multi: true}, function(err, bands) {
                                    previousBand = band;
                                    jobStats.processed++;
                                    cb();
                                    return true;
                                });
                            });
                        }
                    } 

                } else {   
                    //util.log('NO MATCH');
                    //util.log(band.band_name + ' - ' + previousBand.band_name);
                    //util.log(band.genres + ' - ' + previousBand.genres);
                    previousBand = band;
                    cb();
                }
            },
            function (err) {
                util.log('done with update');
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
                        process.exit(1);
                    });
                } 
                process.exit(1);
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


