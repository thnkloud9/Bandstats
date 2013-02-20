/**
 * Job Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var xml2js = require('xml2js');

var JobRepository = require('./../repositories/JobRepository.js');

/**
 * constructor
 */
var JobController = function(db, jobScheduler) {

    /**
     * Load the job repo for mongo connectivity
     */
    this.jobRepository = new JobRepository({'db': db});
    this.jobScheduler = jobScheduler;
    this.data = {"section": "job"};

    this.indexAction = function(req, res) {
        var data = this.data;
        var query = {};
        if (req.query.search) {
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            query = {"job_name": search};
        }
        this.jobRepository.find(query, {}, function(err, jobs) {
            _.extend(data, { 'jobs': jobs });
            var template = require('./../views/job_index');
            res.send(template.render(data));
        });
    }

    this.runningAction = function(req, res) {
        var runningJobs = this.jobScheduler.getRunningJobs();
        res.send(runningJobs);
    }

    this.scheduledAction = function(req, res) {
        var data = [];
        var scheduledJobs = this.jobScheduler.getScheduledJobs();
        for (var j in scheduledJobs) {
            var job = scheduledJobs[j];
            data.push({ 
                "job_name": job.job_name, 
                "job_id": job.job_id, 
                "schedule": job.cronTime.source
            });
        }
        res.send(data);

    } 

    this.editAction = function(req, res) {
        var data = this.data;
        var query = {'job_id': req.params.id};
        var jobRepository = this.jobRepository;
        var template = require('./../views/job_edit');
        _.extend(data, {json: {}});

        if (req.params.id === "0") {
            // this is a new record
            data.job = {};
            data.json.job = JSON.stringify({});
            res.send(template.render(data));
        } else {
            // get the record from the db
            this.jobRepository.findOne(query, function(err, job) {
                if ((err) || (!job)) {
                    res.send({status: "error", error: "job not found"});
                    return false;
                }
                delete job._id;
                data.job = job;
                data.json.job = JSON.stringify(job);
                res.send(template.render(data));
            });
        }
    }

    this.updateAction = function(req, res) {
        if ((req.route.method != "put") || (!req.body.values)) {
            res.send({status: "error", error: "update must be put action and must include values"});
            return false;
        }
        var parent = this;
        var query = {'job_id': req.params.id};
        var values = req.body.values;
        var jobRepository = this.jobRepository

        jobRepository.update(query, values, {}, function(err, updated) {
            if ((err) || (!updated)) {
                res.send({status: "error", error: err});
                return false;
            }

            // update the job scheduler
            var scheduledJobs = parent.jobScheduler.getScheduledJobs();
            for (var j in scheduledJobs) {
                var job = scheduledJobs[j];
                console.log('stopping job scheduled for ' + job.cronTime.source);
                job.stop();
            }
            parent.jobScheduler.initSchedule();
 
            // send updated job back
            res.send({status: "success", updated: updated});        
        });

    }

    this.removeAction = function(req, res) {
        if ((req.route.method != "delete") || (!req.params.id)) {
            var data = {
                status: "error",
                error: "remove must be delete action and must be called from a job resource",
                method: req.route.method,
                id: req.params.id
            };
            res.send(data);
        }
        var query = {'job_id': req.params.id};
        
        this.jobRepository.remove(query, {safe: true}, function(err, removed) {
            if ((err) || (!removed)) {
                res.send({status: "error", error: err});
                return false;
            }
            res.send({status: "success", id: req.params.id, removed: removed});
        });
    }

    this.createAction = function(req, res) {
        if ((req.route.method != "post") || (!req.body.values)) {
            var data = {
                status: "error",
                error: "insert must be post action and must include values",
                method: req.route.method,
                values: req.body.values 
            };
            res.send(data);
        }    
        this.jobRepository.insert(req.body.values, {}, function(err, job) {
            res.send({status: "success", job: job});
        });
    }
}

/* export the class */
exports.controller = JobController;
