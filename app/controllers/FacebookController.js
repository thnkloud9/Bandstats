/**
 * Facebook Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var FacebookManager = require('./../lib/FacebookManager.js');
var BandRepository = require('./../repositories/BandRepository.js');

/**
 * constructor
 */
var FacebookController = function(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.facebookManager = new FacebookManager();

    /**
     * takes a band name as query param
     * and returns search results from 
     * facebook graph api
     */
    this.searchAction = function(req, res) {
        if (!req.query.search) {
            res.send({"status": "error", "error": "you must provide search param"});
            return false;
        }
        var api = this.apiDomain;
        var query = req.query.search;
        this.facebookManager.search(query, function(err, results) { 
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send([{"search": req.query.search, "results": results}]);
        });
    };

    this.lookupAction = function(req, res) {
        var query = {};
        var parent = this;

        if (req.params.id === "lookup") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        
        };

        // lookup should send to appropriate LookupManager function
        // based on req.params.id value
        if (req.query.search) {
            query = req.query.search;
        } else {
            // get all bands without facebook ids
            query = {
                $or: [
                    {"external_ids.facebook_id": null},
                    {"external_ids.facebook_id": ""}
                ]
            };
        };
        
        // only send 50 due to rate limits (600 max)
        var options = {
            "limit": 50
        };

        // loop through bands and make search object to send to lookups
        this.bandRepository.find(query, options, function(err, results) {
            var searchObj = [];

            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }

            async.forEach(results, function(band, cb) {
                var searchItem = {
                    "band_id": band.band_id,
                    "band_name": band.band_name,
                    "search": band.band_name
                };

                searchObj.push(searchItem);

                cb(null, searchObj);
            },
            function(err, results) {
                if (err) {
                    res.send({"status": "error", "error": err, "results": results});
                    return false;
                }

                // call facebook lookup
                parent.facebookManager.searchList(searchObj, function(err, results) {
                    if (err) {
                        res.send({"status": "error", "error": err, "results": results});
                        return false;
                    }
                    res.send(results);
                });
            });
        });
    };

    this.imageAction = function(req, res) {
        if (req.params.id === "image") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPageImage(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    };

    this.pageAction = function(req, res) {
        if (req.params.id === "page") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPage(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    };

    this.talkingAboutAction = function(req, res) {
        if (req.params.id === "talking-about") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPageTalkingAbout(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results.toString());
        });
    };

    this.bioAction = function(req, res) {
        if (req.params.id === "bio") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPageBio(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results.toString());
        });
    };

    this.descriptionAction = function(req, res) {
        if (req.params.id === "description") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPageDescription(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results.toString());
        });
    };

    this.likesAction = function(req, res) {
        if (req.params.id === "likes") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.facebookManager.getPageLikes(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results.toString());
        });
    };
}

/* export the class */
exports.controller = FacebookController;
