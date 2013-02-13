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

var BandRepository = require('./../repositories/BandRepository.js');
var LastfmManager = require('./../lib/LastfmManager.js');

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
