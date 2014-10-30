/**
 * Band Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var nconf = require('nconf');
nconf.file(path.join(__dirname, 'app/config/app.json'));

var BandRepository = require('./../../repositories/BandRepository.js');
var UserRepository = require('./../../repositories/UserRepository.js');
var SessionRepository = require('./../../repositories/SessionRepository.js');
var JobRepository = require('./../../repositories/JobRepository.js');
var SiteRepository = require('./../../repositories/SiteRepository.js');

/**
 * constructor
 */
function DashboardController(db) {

    /**
     * Load the band repo for mongo connectivity
     */
    this.bandRepository = new BandRepository({'db': db});
    this.userRepository = new UserRepository({'db': db});
    this.sessionRepository = new SessionRepository({'db': db});
    this.jobRepository = new JobRepository({'db': db});
    this.siteRepository = new SiteRepository({'db': db});
}

DashboardController.prototype.bandStatsAction = function(req, res) {
    var data = {};
    var parent = this;

    async.series({
        total: function(cb) {
                parent.bandRepository.count({}, function(err, count) {
                    cb(err, count);
                });
        },
        missing_facebook: function(cb) {
                parent.bandRepository.count({"external_ids.facebook_id": ""}, function(err, count) {
                    cb(err, count);
                });
        },
        missing_lastfm: function(cb) {
                parent.bandRepository.count({"external_ids.lastfm_id": ""}, function(err, count) {
                    cb(err, count);
                });
        },
        bad_facebook: function(cb) {
                parent.bandRepository.count({"failed_lookups.facebook": { $gt : 0 }}, function(err, count) {
                cb(err, count);
                }); 
        },
        bad_lastfm: function(cb) {
                parent.bandRepository.count({"failed_lookups.lastfm": { $gt : 0 }}, function(err, count) {
                cb(err, count);
                }); 
        },
    },
    function(err, data) {
	    res.send(data);
    });
}

DashboardController.prototype.genresAction = function(req, res) {
    var parent = this;
    var data = {};

    this.bandRepository.getDistinctValues('genres', {}, function(err, genres) {
        if (err) util.log(err);
        async.forEach(genres, function(genre, cb) {
	        parent.bandRepository.count({genres: {$in: [genre]}}, function(err, count) {
		        if (err) util.log(err);
		        data[genre] = count;
		        cb(err);
	        });	
	    },
        function (err) {
            res.send(data);
        });

    });
}

DashboardController.prototype.regionsAction = function(req, res) {
    var parent = this;
    var data = {};

    this.bandRepository.getDistinctValues('regions', {}, function(err, regions) {
        if (err) util.log(err);
        async.forEach(regions, function(region, cb) {
            parent.bandRepository.count({regions: {$in: [region]}}, function(err, count) {
                if (err) util.log(err);
                data[region] = count;
                cb(err);
            });	
        },
        function (err) {
            res.send(data);
        });
    });
}

DashboardController.prototype.activeJobStatsAction = function(req, res) {
    this.jobRepository.find({"job_active": "true"}, {}, function(err, jobs) {
	    res.send(jobs);
    });

}

DashboardController.prototype.userStatsAction = function(req, res) {
    var data = {};
    var parent = this;

    async.series({
        total: function(cb) {
                parent.userRepository.count({}, function(err, count) {
                    cb(err, count);
                });
        },
        active: function(cb) {
                parent.userRepository.count({"active": true}, function(err, count) {
                    cb(err, count);
                });
        },
        online: function(cb) {
                parent.sessionRepository.count({}, function(err, count) {
                    cb(err, count);
                });
        },
    },
    function(err, data) {
	    res.send(data);
    });

}

/* export the class */
exports.controller = DashboardController;
