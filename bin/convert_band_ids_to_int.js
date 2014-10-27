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
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});
var bandRepository = new BandRepository({'db': db}); 
var jobRepository = new JobRepository({'db': db}); 
var processStart = new Date().getTime();
var processed = 0;
var jobStats = {
    "errors": 0,
    "processed": 0
};

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-p, --no_prompt', 'turn prompt off')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('update')
    .description('converts string based band_id fields to type int')
    .action(function() { 

        var query = buildQuery();

        getBands(query, function(err, bands) {
            if (!program.no_prompt) {
                program.confirm("Confirm band_id field conversion?  You will affect " + bands.length + " band records ", function(ok) {
                    if (!ok) {
                        console.log("cancelling band edit")
                        process.exit(1);
                    }
                    
                    convertBandId(bands, function(err, results) {
                        process.exit(1);
                    });     
                });
            } else {
                convertBandId(bands, function(err, results) {
                    process.exit(1);
                });     
            }
        });
    });

/**
 * Functions
 */
function buildQuery() {
    if (program.band_id) {
        var query = { 'band_id': parseInt(program.band_id) };
    } else if (program.band_name) {
        var query = { 'band_name': program.band_name };
    } else {
        var query = {};
        query['running_stats.' + program.field + '.daily_stats'] = {$ne: []};
    }
    return query;
}

function getBands(query, callback) {
    db.collection('bands').find(query).toArray(function(err, results) {
        if (err) throw err;
        callback(err, results);
    });
}

function convertBandId(bands, callback) {
    async.forEach(bands, function(band, cb) {
        if (!band) {
            jobStats.errors++;
            cb();
            return false;
        }
        
        var set = { $set: { "band_id" : band.band_id.toString() }};
    
        db.collection('bands').update({_id: band._id}, set, function(err, result) {
            if (err) jobStats.errors++;
            util.log('updated ' + band.band_name + ' band_id ' + band.band_id);
            cb();
        });
    },
    function (err) {
        util.log('done with update');
        callback(err);
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
// process command line args
program.parse(process.argv);
