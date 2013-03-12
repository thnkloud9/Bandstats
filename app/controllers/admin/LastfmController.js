/**
 * Lastfm Controller
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var BandRepository = require('./../../repositories/BandRepository.js');
var LastfmManager = require('./../../lib/LastfmManager.js');

/**
 * constructor
 */
var LastfmController = function(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.lastfmManager = new LastfmManager();

    /**
     * takes a band name as query param
     * and returns search results from 
     * lastfm api
     */
    this.searchAction = function(req, res) {
        if (!req.query.search) {
            res.send({"status": "error", "error": "you must provide search param"});
            return false;
        }
        
        this.lastfmManager.search(req.query.search, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send([{"search": req.query.search, "results": results}]);
        });  
    }

    /**
     * takes a bands query and loops through each result and maps
     * to a lastfm manager function using external_ids.lastfm_id (or
     * band_name if lookupFunction is search
     */
    this.lookupAction = function(req, res) {
        var parent = this;
        var query = {};
        var resource = req.params.id;
        var lookupFunction = resource;

        if (req.params.id === "lookup") {
            res.send({"status": "error", "error": "must be called with resource param"});
            return false;
        
        };

        // if no search query provided use band_name on search lookups
        // and lastfm_id on anything else
        if (req.query.search) {
            query = req.query.search;
        } else {
            if (resource === 'search') {
                // get all bands without lastfm ids
                query = {
                    $or: [
                        {"external_ids.lastfm_id": null},
                        {"external_ids.lastfm_id": ""}
                    ]
                };
            } else if (resource === 'fail_search') {
                query = {
                    $and: [
                        {"external_ids.lastfm_id": {$ne: null}},
                        {"external_ids.lastfm_id": {$ne: ""}},
                        {"running_stats.lastfm_listeners.current": /^error.*/}
                    ]
                };
                resource = 'search';
                lookupFunction = 'search';
            } else {
                query = {
                    $and: [
                        {"external_ids.lastfm_id": {$ne: null}},
                        {"external_ids.lastfm_id": {$ne: ""}},
                        {"external_ids.lastfm_id": /\d+/}
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
                    searchItem.search = band.external_ids.lastfm_id;
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

                // call lastfm lookup
                parent.lastfmManager.lookup(searchObj, lookupFunction, function(err, results) {
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

    this.infoAction = function(req, res) {
        if (req.params.id === "info") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getInfo(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.toptagsAction = function(req, res) {
        if (req.params.id === "toptags") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getTopTags(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.eventsAction = function(req, res) {
        if (req.params.id === "events") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getEvents(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.bioAction = function(req, res) {
        if (req.params.id === "bio") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getBio(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.playsAction = function(req, res) {
        if (req.params.id === "plays") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getPlays(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.listenersAction = function(req, res) {
        if (req.params.id === "listeners") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getListeners(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
            
        });
    }

    this.mbidAction = function(req, res) {
        if (req.params.id === "mbid") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.lastfmManager.getMbid(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
            
        });
    }

    this.imageAction = function(req, res) {
        if (req.params.id === "images") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }
        
        this.lastfmManager.getImage(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

}

/* export the class */
exports.controller = LastfmController;
