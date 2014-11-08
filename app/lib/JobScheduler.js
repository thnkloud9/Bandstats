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
var later = require('later').later;
var cron = require('later').cronParser;
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
    this.children = [];
};

JobScheduler.prototype.getScheduledJobs = function() {
    return this.scheduledJobs;
}

/**
 * this function gets future events based on the crontab style scheduling
 */
JobScheduler.prototype.getScheduledEvents = function() {
    var scheduledEvents = [];
    var scheduledJobs = this.scheduledJobs;
    for (var j in scheduledJobs) {
        var job = scheduledJobs[j];
        // build events from 
        cSched = cron().parse(job.cronTime.source, true);
        var start = new Date();
        start.setDate(start.getDate() - 7);
        var eventSchedule = later(10).get(cSched, 100, start);

        for (var e in eventSchedule) {
            var jobDuration = parseInt(job.job_duration);
            var scheduledEventStart = new Date(eventSchedule[e]);
            var scheduledEventEnd = new Date(eventSchedule[e]);
            if (!jobDuration || jobDuration < (30 * 60 * 1000)) {
                jobDuration = (30 * 60 * 1000);
            }
            scheduledEventEnd.setMilliseconds(scheduledEventEnd.getMilliseconds() + jobDuration);
            scheduledEvents.push({
                "title": job.job_name,
                "id": job.job_id,
                "start": scheduledEventStart,
                "end": scheduledEventEnd,
                "schedule": job.cronTime.source,
            });
        }
    }

    return scheduledEvents;
}

JobScheduler.prototype.getRunningJobs = function() {
    var updatedRunningJobs = [];
    for (var j in this.runningJobs) {
        var job = this.runningJobs[j];
        var start = new Date(job.time).getTime();
        var now = new Date().getTime();
        var runningTime = (now - start);
        job.running_time = runningTime;
        updatedRunningJobs.push(job);
    }
    return updatedRunningJobs;
}

JobScheduler.prototype.getJobs = function(query, options, callback) {
    this.jobRepository.find(query, options, function(err, jobs) {
        callback(err, jobs);
    }); 
}

JobScheduler.prototype.startJob = function(job) {
    var parent = this;
    var args = job.job_arguments.split(' ');

    util.log('starting job ' + job.job_name + ' child process ' + job.job_command + ' ' + job.job_arguments);

    // start the child process
    var cp = child_process.spawn('./bin/'+job.job_command, args);
    var cpid = cp.pid;

    // add the pid to the runningJobs list
    var now = moment().format('YYYY-MM-DD HH:mm:ss');
    var runningJob = {
        "pid": cpid,
        "output": "started\n",
        "job_id": job.job_id,
        "job_name": job.job_name,
        "job_arguments": job.job_arguments,
        "job_description": job.job_description,
        "job_last_duration": job.job_duration,
        "job_duration": 0,
        "action": "started",
        "time": now
    }
    parent.runningJobs.push(runningJob);
    parent.children.push(_.extend(cp, runningJob));
    // add to the job log
    parent.db.collection('job_log').insert(runningJob, {}, function(err, inserted) {
        if (err) util.log(err);
    });

    // ad event listener to remove from runningJobs on exit
    cp.on('exit', function() {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        var lastOutput = "";
 
        util.log('child ' + cpid + ' has exited');

        // remove the job from the runningJobs array
        for (var i = 0; i < parent.runningJobs.length; i++) {
            if (parent.runningJobs[i].pid === cpid) {
                lastOutput = parent.runningJobs[i].output;
                parent.runningJobs.splice(i, 1);
                break;
            } 
        };
        // remove from the jobs pids in the database
        parent.jobRepository.update({"job_id": job.job_id}, { $set: {"last_output": lastOutput }, $pull: {"pids": cpid} }, {"multi": true}, function(err, updated) {
            util.log('removing pid ' + cpid + ' from job_id ' + job.job_id);
        });
        // add to the job log
        var exitedJob = {
            "pid": cpid,
            "job_id": job.job_id,
            "job_name": job.job_name,
            "job_arguments": job.job_arguments,
            "action": "ended",
            "job_duration": job.job_duration,
            "job_processed": job.job_processed,
            "job_failed": job.job_failed,
            "time": now
        }
        parent.db.collection('job_log').insert(exitedJob, {}, function (err, inserted) {
            if (err) util.log(err);
        });
    });

    // log childs output
    cp.stdout.on('data', function(data) {
        for (var i = 0; i < parent.runningJobs.length; i++) {
            if (parent.runningJobs[i].pid === cpid) {
                var job = parent.runningJobs[i];
                job.output += data;
                break;
            } 
        };
    });

    // add the pid to the jobs pid array in the database 
    parent.jobRepository.update({"job_id": job.job_id}, { $addToSet: {"pids": cpid} }, {"multi": true}, function(err, updated) {
        util.log('adding pid ' + cpid + ' to job_id ' + job.job_id);
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
                        parent.startJob(job);
                    },
                    start: true
                });
                parent.scheduledJobs[count].start();
                parent.scheduledJobs[count].job_name = job.job_name;
                parent.scheduledJobs[count].job_id = job.job_id;
                parent.scheduledJobs[count].job_duration = job.job_duration;

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
