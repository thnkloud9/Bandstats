/**
 * JobScheduler 
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var cronJob = require('cron').CronJob;
var child_process = require('child_process');
var moment = require('moment');
var util = require('util');

var JobRepository = require('./../repositories/JobRepository.js');

function JobScheduler(db) {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.db = db;
    this.jobRepository = new JobRepository({'db': db});

    this.scheduledJobs = [];
    this.runningJobs = [];
};

JobScheduler.prototype.getScheduledJobs = function() {
    return this.scheduledJobs;
}

JobScheduler.prototype.getRunningJobs = function() {
    return this.runningJobs;
}

JobScheduler.prototype.getJobs = function(query, options, callback) {
    this.jobRepository.find(query, options, function(err, jobs) {
        callback(err, jobs);
    }); 
}

JobScheduler.prototype.initSchedule = function() {
    var parent = this;

    // clear out job pids from database
    parent.jobRepository.update({}, { $set: {"pids": []}}, {"multi": true}, function(err, updated) {
        util.log('removing pids from all jobs');
    });
    
    // get job schedule from the database
    this.getJobs({"job_active": "true"}, {}, function(err, jobs) {
        
        var count = 0;
        async.forEach(jobs, function(job, cb) {
            try {
                var schedule = job.job_schedule;
                parent.scheduledJobs[count] = new cronJob({
                    cronTime: schedule,
                    onTick: function() {
                        var args = job.job_arguments.split(' ');

                        util.log('starting job ' + job.job_name + ' child process ' + job.job_command + ' ' + job.job_arguments);

                        // start the child process
                        var cp = child_process.spawn('./bin/'+job.job_command, args);
                        var cpid = cp.pid;

                        // add the pid to the runningJobs list
                        var now = moment().format('YYYY-MM-DD HH:mm:ss');
                        var runningJob = {
                            "pid": cpid,
                            "job_id": job.job_id,
                            "job_name": job.job_name,
                            "job_arguments": job.job_arguments,
                            "action": "started",
                            "time": now
                        }
                        parent.runningJobs.push(_.extend(cp, runningJob));
                        // add to the job log
                        parent.db.collection('job_log').insert(runningJob, {}, function(err, inserted) {
                            if (err) util.log(err);
                        });

                        // ad event listener to remove from runningJobs on exit
                        cp.on('exit', function() {
                            var now = moment().format('YYYY-MM-DD HH:mm:ss');
                            util.log('child ' + cpid + ' has exited');

                            // remove the job from the runningJobs array
                            for (var i = 0; i < parent.runningJobs.length; i++) {
                                if (parent.runningJobs[i].pid === cpid) {
                                    parent.runningJobs.splice(i, 1);
                                    break;
                                } 
                            };
                            // remove from the jobs pids in the database
                            parent.jobRepository.update({"job_id": job.job_id}, { $pull: {"pids": cpid} }, {"multi": true}, function(err, updated) {
                                util.log('removing pid ' + cpid + ' from job_id ' + job.job_id);
                            });
                            // add to the job log
                            var exitedJob = {
                                "pid": cpid,
                                "job_id": job.job_id,
                                "job_name": job.job_name,
                                "job_arguments": job.job_arguments,
                                "action": "ended",
                                "time": now
                            }
                            parent.db.collection('job_log').insert(exitedJob, {}, function (err, inserted) {
                                if (err) util.log(err);
                            });
                        });

                        // add the pid to the jobs pid array in the database 
                        parent.jobRepository.update({"job_id": job.job_id}, { $addToSet: {"pids": cpid} }, {"multi": true}, function(err, updated) {
                            util.log('adding pid ' + cpid + ' to job_id ' + job.job_id);
                        });
                    },
                    start: true
                });
                parent.scheduledJobs[count].start();
                parent.scheduledJobs[count].job_name = job.job_name;
                parent.scheduledJobs[count].job_id = job.job_id;

                util.log('started ' + job.job_name + ' with schedule ' + job.job_schedule);
            } catch (err) {
                util.log('cron pattern not valid for ' + job.job_name);
                cb(err)
                return false;
            }
            count++;
            cb();
        },
        function (err, results) {
            if (err) {
                util.log(err);
            }
            util.log('added all scheduled jobs');
        });
    });
};

module.exports = JobScheduler; 
