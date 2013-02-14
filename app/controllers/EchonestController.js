/**
 * Echonest Controller
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var BandRepository = require('./../repositories/BandRepository.js');
var EchonestManager = require('./../lib/EchonestManager.js');

/**
 * constructor
 */
var EchonestController = function(db) {

    this.bandRepository = new BandRepository({'db': db});
    this.echonestManager = new EchonestManager();

    /**
     * takes a band name as query param
     * and returns search results from 
     * echonest api
     */
    this.searchAction = function(req, res) {
        if (!req.query.search) {
            res.send({"status": "error", "error": "you must provide search param"});
            return false;
        }
        
        this.echonestManager.search(req.query.search, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send([{"search": req.query.search, "results": results}]);
        });  
    }

    this.profileAction = function(req, res) {
        if (req.params.id === "info") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.echonestManager.getProfile(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.termsAction = function(req, res) {
        if (req.params.id === "terms") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.echonestManager.getTerms(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.biographiesAction = function(req, res) {
        if (req.params.id === "biographies") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.echonestManager.getBiographies(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

    this.hotttnesssAction = function(req, res) {
        if (req.params.id === "hotttnesss") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }

        this.echonestManager.getHotttnesss(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
            
        });
    }

    this.imagesAction = function(req, res) {
        if (req.params.id === "images") {
            res.send({"status": "error", "error": "must be called with id param"});
            return false;
        }
        
        this.echonestManager.getImages(req.params.id, function(err, results) {
            if (err) {
                res.send({"status": "error", "error": err});
                return false;
            }
            res.send(results);
        });
    }

}

/* export the class */
exports.controller = EchonestController;
