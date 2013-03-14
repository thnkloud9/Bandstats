/**
 * Soundcloud Controller
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var BandRepository = require('./../../repositories/BandRepository.js');
var SoundcloudManager = require('./../../lib/SoundcloudManager.js');

/**
 * constructor
 */
function SoundcloudController(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.soundcloudManager = new SoundcloudManager();
}

/**
 * takes a band name as query param
 * and returns search results from 
 * soundcloud api
 */
SoundcloudController.prototype.searchAction = function(req, res) {
    if (!req.query.search) {
        res.send({"status": "error", "error": "you must provide search param"});
        return false;
    }
    
    this.soundcloudManager.search(req.query.search, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send([{"search": req.query.search, "results": results}]);
    });  
}

/**
 * takes a bands query and loops through each result and maps
 * to a echoenst manager function using external_ids.soundcloud_id (or
 * band_name if lookupFunction is search
 */
SoundcloudController.prototype.lookupAction = function(req, res) {
    var parent = this;
    var query = {};
    var resource = req.params.id;
    var lookupFunction = resource;

    if (req.params.id === "lookup") {
        res.send({"status": "error", "error": "must be called with resource param"});
        return false;
    
    };

    // if no search query provided use band_name on search lookups
    // and echoenst_id on anything else
    if (req.query.search) {
        query = req.query.search;
    } else {
        if (resource === 'search') {
            // get all bands without echoenst ids
            query = {
                $or: [
                    {"external_ids.soundcloud_id": null},
                    {"external_ids.soundcloud_id": ""}
                ]
            };
        } else {
            query = {
                $and: [
                    {"external_ids.soundcloud_id": {$ne: null}},
                    {"external_ids.soundcloud_id": {$ne: ""}}
                ]
            };
        }
    };
    
    // only send 200 due to rate limits (600 max)
    var options = {
        "limit": 200
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
                searchItem.search = band.external_ids.soundcloud_id;
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

            // call soundcloud lookup
            parent.soundcloudManager.lookup(searchObj, lookupFunction, function(err, results) {
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

SoundcloudController.prototype.profileAction = function(req, res) {
    if (req.params.id === "info") {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }

    this.soundcloudManager.getProfile(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send(results);
    });
}

SoundcloudController.prototype.tracksAction = function(req, res) {
    if (req.params.id === "terms") {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }

    this.soundcloudManager.getTracks(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send(results);
    });
}

/* export the class */
exports.controller = SoundcloudController;
