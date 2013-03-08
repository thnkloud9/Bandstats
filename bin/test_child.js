#!/usr/bin/env node

var program = require('commander');
var moment = require('moment');
var now = moment().format('YYYY-MM-DD HH:mm:ss');
var util = require('util');
var path = require('path');
var nconf = require('nconf');
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});
var jobRepository = new JobRepository({'db': db}); 
var processStart = new Date().getTime();

program
    .version('0.0.1')
    .option('-m, --me <me>', 'name to echo out')
    .option('-s, --sleep <sleep>', 'how long the job should run (in seconds)')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-p, --processed <num>', 'number of processed for job stats')
    .option('-f, --failed <num>', 'number of failed for job stats')

program.parse(process.argv);

// tell the world about myself
util.log(now + ' Im a child, my name is ' + program.me);

if (program.sleep) {
  var sleep = program.sleep;
} else {
  var sleep = 30;
}
// now wait sleep minutes and send something else
waitToRun(function() {
    updateJob(function(err, result) {
        if (err) util.log(err);
        util.log('end here');
        process.exit(1);
    });
});

function waitToRun(callback) {
    var wait = setTimeout(function(){
        util.log("This is last my message, I am " + program.me);
        callback();
    },(sleep * 1000));
}

function updateJob(callback) {
    var processEnd = new Date().getTime();
    var duration = (processEnd - processStart);
    if (program.job_id) {
        var query = {"job_id": program.job_id};
        var values = {
            $set: {
                "job_processed": program.processed,
                "job_failed": program.failed,
                "job_last_run": new Date(),
                "job_duration": duration
            }
        }
        util.log('here first');
        jobRepository.update(query, values, function(err, result) {
            if (err) util.log(err);
            util.log('here');
            callback(err, result);
        });
    }
} 
