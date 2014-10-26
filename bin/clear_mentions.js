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
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('update')
    .description('clears mentions array for given bands')
    .action(function() {

        if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } else {
	    var query = {};
        }

        db.collection('bands').find(query).toArray(function(err, results) {
            if (err) throw err;

            var results = results;
            async.forEach(results, function(result, cb) {
                
		        var bandId = result.band_id;

                db.collection('bands').update({"band_id": bandId}, {$set: {"mentions": []}}, { "multi": true}, function(err, result) {
                    if (err) jobStats.errors++;
                    util.log('updated band_id ' + bandId);
                    cb();
                });
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


