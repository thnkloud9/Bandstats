/**
 * Job Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var util = require('util');
var later = require('later').later;
var cron = require('later').cronParser;
var JobRepository = require('./../../repositories/JobRepository.js');

/**
 * constructor
 */
function JobController(db, jobScheduler) {

    /**
     * Load the job repo for mongo connectivity
     */
    this.db = db;
    this.jobRepository = new JobRepository({'db': db});
    this.jobScheduler = jobScheduler;
}

JobController.prototype.indexAction = function(req, res) {
    // forward POST, PUT, and DELETE request to appropriate actions
    if (req.route.method == "post") {
      this.createAction(req, res);
    }

    if (req.route.method == "put") {
      this.updateAction(req, res);
    }

    if (req.route.method == "delete") {
      this.removeAction(req, res);
    }

    var parent = this;
    var jobId = req.params.id;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {};

    if (jobId) {
        query.job_id = jobId;
    }

    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        query = {"job_name": search};
    }

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };

    var orderedQuery = {
        $query: query,
        $orderby: {"job_category": 1}
    }

    this.jobRepository.count(query, function(err, count) {
        parent.jobRepository.find(orderedQuery, {}, function(err, jobs) {
            var results = {
                "totalRecords": count,
                "data": jobs
            }
            if (jobId) {
                res.send(jobs[0]);
                return true;
            } else {
                res.send(results);
                return true;
            } 
            
        });
    });
}

JobController.prototype.countAction = function(req, res) {
    this.jobRepository.count({}, function(err, count) {
        res.send({"count": count});
    });
}

JobController.prototype.runningAction = function(req, res) {
    var runningJobs = this.jobScheduler.getRunningJobs();
    var data = { 
        'totalRecords' : runningJobs.length,
        'data': runningJobs,
        'running_jobs_json': JSON.stringify(runningJobs) 
    };
    res.send(data);
}

JobController.prototype.logAction = function(req, res) {
    var parent = this;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {
        $query: {},
        $orderby: {
            "time": -1
        }
    }

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };

    // TODO: orderby breaks count, need to serparate these later
    this.db.collection('job_log').count({}, function(err, count) {
	if (err) util.log(err);
	util.log(count);

        parent.db.collection('job_log').find(query, options).toArray(function(err, results) {
            if (err) res.send(err);

            var results = {
                "totalRecords": count,
                "data": results 
            }
            res.send(results);
        });
    });
}

JobController.prototype.scheduledAction = function(req, res) {
    var scheduledEvents = this.jobScheduler.getScheduledEvents();
    res.send(scheduledEvents);
} 

JobController.prototype.startAction = function(req, res) {
    if ((req.route.method != "get")) {
        res.send({status: "error", error: "start must be get action and must include values"});
        return false;
    }
    var parent = this;
    var query = {'job_id': req.params.id};
    var args = req.query.args;
    var jobRepository = this.jobRepository

    jobRepository.findOne(query, function(err, job) {
        if ((err) || (!job)) {
            res.send({status: "error", error: err});
            return false;
        }

        // apply args
        if (args) {
          job.job_arguments = args;
        }

        // update the job scheduler
        var scheduledJobs = parent.jobScheduler.getScheduledJobs();
        parent.jobScheduler.startJob(job);

        // send updated job back
        res.send({status: "success", job: job});        
    });
}

JobController.prototype.updateAction = function(req, res) {
    if (req.route.method != "put") {
        res.send({status: "error", error: "update must be put action and must include values"});
        return false;
    }
    var parent = this;
    var query = {'job_id': req.params.id};
    var values = req.body;
    var jobRepository = this.jobRepository

    delete values._id;

    jobRepository.update(query, values, {}, function(err, updated) {
        if ((err) || (!updated)) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500);
            res.send();
            return false;
        }

        // update the job scheduler
        var scheduledJobs = parent.jobScheduler.getScheduledJobs();
        for (var j in scheduledJobs) {
            var job = scheduledJobs[j];
            util.log('stopping job scheduled for ' + job.cronTime.source);
            job.stop();
        }
        parent.jobScheduler.initSchedule();

        // send updated job back
        util.log('updated job ' + values.job_id);
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send();
    });
}

JobController.prototype.removeAction = function(req, res) {
    var parent = this;
    if ((req.route.method != "delete") || (!req.params.id)) {
        var data = {
            status: "error",
            error: "remove must be delete action and must be called from a job resource",
            method: req.route.method,
            id: req.params.id
        };
        res.send(data);
        return false;
    }
    var query = {'job_id': req.params.id};
    
    this.jobRepository.remove(query, {safe: true}, function(err, removed) {
        if ((err) || (!removed)) {
            res.send({status: "error", error: err});
            return false;
        }

        // update the job scheduler
        var scheduledJobs = parent.jobScheduler.getScheduledJobs();
        for (var j in scheduledJobs) {
            var job = scheduledJobs[j];
            util.log('stopping job scheduled for ' + job.cronTime.source);
            job.stop();
        }
        parent.jobScheduler.initSchedule();

        res.send({status: "success", id: req.params.id, removed: removed});
    });
}

JobController.prototype.createAction = function(req, res) {
    var parent = this;
    if (req.route.method != "post") {
        var data = {
            status: "error",
            error: "insert must be post action and must include values",
            method: req.route.method,
            values: req.body
        };
        res.send(data);
    }    
    this.jobRepository.insert(req.body, {}, function(err, newJob) {
        // update the job scheduler
        var scheduledJobs = parent.jobScheduler.getScheduledJobs();
        for (var j in scheduledJobs) {
            var job = scheduledJobs[j];
            util.log('stopping job scheduled for ' + job.cronTime.source);
            job.stop();
        }
        parent.jobScheduler.initSchedule();

        util.log('saving new job: ' + newJob.job_id);
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send();
    });
}

JobController.prototype.clearLogAction = function(req, res) {
    if (req.route.method != "delete") {
        var data = {
            status: "error",
            error: "clear-log must be delete action",
            method: req.route.method,
            values: req.body
        };
        res.send(data);
        return false;
    }
    this.db.collection('job_log').remove({}, function(err, results) {
        if (err) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500);
            res.send({"status": false, "message": err});
            return false;
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send({"status": true, "message": "log cleared"});
    });
}

/* export the class */
exports.controller = JobController;
