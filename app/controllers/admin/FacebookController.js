/**
 * Facebook Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var FacebookManager = require('./../../lib/FacebookManager.js');
var BandRepository = require('./../../repositories/BandRepository.js');

/**
 * constructor
 */
function FacebookController(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.facebookManager = new FacebookManager();
}

/**
 * takes a band name as query param
 * and returns search results from 
 * facebook graph api
 */
FacebookController.prototype.searchAction = function(req, res) {
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

/**
 * takes a bands query and loops through each result and maps
 * to a facebook manager function using external_ids.facebook_id (or
 * band_name if lookupFunction is search
 */
FacebookController.prototype.lookupAction = function(req, res) {
    var parent = this;
    var query = {};
    var resource = req.params.id;
    var lookupFunction = resource;

    if (req.params.id === "lookup") {
        res.send({"status": "error", "error": "must be called with resource param"});
        return false;
    
    };

    // if no search query provided use band_name on search lookups
    // and facebook_id on anything else
    if (req.query.search) {
        query = req.query.search;
    } else {
        if (resource === 'search') {
            // get all bands without facebook ids
            query = {
                $or: [
                    {"external_ids.facebook_id": null},
                    {"external_ids.facebook_id": ""}
                ]
            };
        } else if (resource === 'fail_search') {
            query = {
                $and: [
                    {"external_ids.facebook_id": {$ne: null}},
                    {"external_ids.facebook_id": {$ne: ""}},
                    {"running_stats.facebook_likes.current": /^error.*/}
                ]
            };
            resource = 'search';
            lookupFunction = 'search';
        } else {
            query = {
                $and: [
                    {"external_ids.facebook_id": {$ne: null}},
                    {"external_ids.facebook_id": {$ne: ""}},
                    {"external_ids.facebook_id": /\d+/}
                ]
            };
        }
    };
    
    // only send 100 due to rate limits (600 max)
    var options = {
        "limit": 100
    };

    // loop through bands and make search object to send to lookups
    this.bandRepository.find(query, options, function(err, results) {
        var searchObj = [];

        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
    
        // build searchObj
        async.forEach(results, function(band, cb) {
            var searchItem = {
                "band_id": band.band_id,
                "band_name": band.band_name,
            };
            if (resource === 'search') {
                searchItem.search = band.band_name;
            } else {
                searchItem.search = band.external_ids.facebook_id;
            }

            searchObj.push(searchItem);

            cb(null, searchObj);
        },
        function(err, results) {
            if (err) {
                var response = {
                    "status": "error", 
                    "error": err, 
                    "results": results 
                };
                res.send(response);
                return false;
            }

            // call facebook lookup
            parent.facebookManager.lookup(searchObj, lookupFunction, function(err, results) {
                if (err) {
                    var response = {
                        "status": "error", 
                        "error": err, 
                        "results": results 
                    };
                    res.send(response);
                    return false;
                }
                res.send(results);
            });
        });
    });
};

FacebookController.prototype.imageAction = function(req, res) {
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

FacebookController.prototype.pageAction = function(req, res) {
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

FacebookController.prototype.talkingAboutAction = function(req, res) {
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

FacebookController.prototype.bioAction = function(req, res) {
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

FacebookController.prototype.descriptionAction = function(req, res) {
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

FacebookController.prototype.likesAction = function(req, res) {
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

/* export the class */
exports.controller = FacebookController;
