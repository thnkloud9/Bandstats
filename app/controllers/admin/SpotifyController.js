/**
 * Spotify Controller
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var BandRepository = require('./../../repositories/BandRepository.js');
var SpotifyManager = require('./../../lib/SpotifyManager.js');

/**
 * constructor
 */
function SpotifyController(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.spotifyManager = new SpotifyManager();
}

SpotifyController.prototype.indexAction = function(req, res) {
    this.infoAction(req, res);
}

/**
 * takes a band name as query param
 * and returns search results from 
 * spotify api
 */
SpotifyController.prototype.searchAction = function(req, res) {
    if (!req.query.search) {
        res.send({"status": "error", "error": "you must provide search param"});
        return false;
    }
    
    this.spotifyManager.search(req.query.search, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send([{"search": req.query.search, "results": results}]);
    });  
}

/**
 * takes a bands query and loops through each result and maps
 * to a spotify manager function using external_ids.spotify_id (or
 * band_name if lookupFunction is search
 */
SpotifyController.prototype.lookupAction = function(req, res) {
    var parent = this;
    var query = {};
    var resource = req.params.id;
    var lookupFunction = resource;

    if (req.params.id === "lookup") {
        res.send({"status": "error", "error": "must be called with resource param"});
        return false;
    
    };

    // if no search query provided use band_name on search lookups
    // and spotify_id on anything else
    if (req.query.search) {
        query = req.query.search;
    } else {
        if (resource === 'search') {
            // get all bands without spotify ids
            query = {
                $or: [
                    {"external_ids.spotify_id": null},
                    {"external_ids.spotify_id": ""}
                ]
            };
        } else if (resource === 'fail_search') {
            query = {
                $and: [
                    {"external_ids.spotify_id": {$ne: null}},
                    {"external_ids.spotify_id": {$ne: ""}},
                    {"running_stats.spotify_followers.current": /^error.*/}
                ]
            };
            resource = 'search';
            lookupFunction = 'search';
        } else {
            query = {
                $and: [
                    {"external_ids.spotify_id": {$ne: null}},
                    {"external_ids.spotify_id": {$ne: ""}},
                    {"external_ids.spotify_id": /\d+/}
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
                searchItem.search = band.external_ids.spotify_id;
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

            // call spotify lookup
            parent.spotifyManager.lookup(searchObj, lookupFunction, function(err, results) {
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

SpotifyController.prototype.infoAction = function(req, res) {
    if (req.params.id === "info" || !req.params.id) {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }

    this.spotifyManager.getInfo(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send(results);
    });
}

SpotifyController.prototype.followersAction = function(req, res) {
    if (req.params.id === "followers") {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }

    this.spotifyManager.getFollowers(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }

        res.send(results.toString());
        
    });
}

SpotifyController.prototype.popularityAction = function(req, res) {
    if (req.params.id === "popularity") {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }

    this.spotifyManager.getPopularity(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send(results.toString());
        
    });
}

SpotifyController.prototype.imageAction = function(req, res) {
    if (req.params.id === "images") {
        res.send({"status": "error", "error": "must be called with id param"});
        return false;
    }
    
    this.spotifyManager.getImage(req.params.id, function(err, results) {
        if (err) {
            res.send({"status": "error", "error": err});
            return false;
        }
        res.send(results);
    });
}

/* export the class */
exports.controller = SpotifyController;
