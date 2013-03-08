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
    .option('-f, --field <field_name>', 'band field name to store the values (example: running_stats.uacebook_likes, lastfm_listeners, etc)')
    .option('-v, --value <value>', 'initial value for field)')
    .option('-l, --limit <num>', 'limit to <num> records')

/**
 * update commands
 */
program
    .command('add')
    .description('adds a field to band document records')
    .action(function() { 

        var query = buildQuery();

        if (!program.field) {
            util.log('field name required');
            process.exit(1);
        }

        if (!program.value) {
            util.log('default value required');
            process.exit(1);
        }

        getBands(query, function(err, bands) {
            if (!program.no_prompt) {
                program.confirm("Confirm field add?  You will affect " + bands.length + " band records ", function(ok) {
                    if (!ok) {
                        console.log("cancelling band edit")
                        process.exit(1);
                    }
                    
                    addField(bands, program.field, program.value, function(err, results) {
                        process.exit(1);
                    });     
                });
            } else {
                addField(bands, function(err, results) {
                    process.exit(1);
                });     
            }
        });
    });

/**
 * view commands
 */
program
    .command('delete')
    .description('not implemented')
    .action(function() {

        var query = buildQuery();

        if (!program.field) {
            util.log('field name required');
            process.exit(1);
        }

        getBands(query, function(err, bands) {
            if (!program.no_prompt) {
                program.confirm("Confirm field add?  You will affect " + bands.length + " band records ", function(ok) {
                    if (!ok) {
                        console.log("cancelling band edit")
                        process.exit(1);
                    }
                    
                    deleteField(bands, program.field, function(err, results) {
                        updateJob(function() {
                            process.exit(1);
                        });
                    });     
                });
            } else {
                deleteField(bands, program.field, function(err, results) {
                    updateJob(function() {
                        process.exit(1);
                    });
                });     
            }
        });
    });

/**
 * Functions
 */
function buildQuery() {
    if (program.band_id) {
        var query = { 'band_id': program.band_id };
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

function deleteField(bands, field, callback) {
    async.forEach(bands, function(band, cb) {
        var conditions = [];
        var fieldQuery = {};
        fieldQuery[field] = { $exists: true };
        conditions.push({"band_id": band.band_id});
        conditions.push(fieldQuery);

        var query = {
            $and: conditions 
        }

        var unset = {};
        unset[field] = 1;
        var set = {
            $unset: unset
        }
        
        db.collection('bands').update(query, set, function(err, result) {
            jobStats.processed++;   
            if (err) jobStats.errors++;
            util.log('updated band_id ' + band.band_id);
            cb();
        });
    },
    function (err) {
        if (err) util.log(err);

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
                callback(err, result);
            });
        } 
        callback(err);
    });
}

function addField(bands, field, value, callback) {
    async.forEach(bands, function(band, cb) {
        if (!band.running_stats[program.field]) {
            jobStats.errors++;
            cb();
            return false;
        }
            
        cb()       
        //db.collection('bands').update({"band_id": bandId}, set, function(err, result) {
        //    if (err) jobStats.errors++;
        //    util.log('updated band_id ' + bandId);
        //    cb();
        //});
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
