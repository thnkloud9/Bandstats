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
            res.send(results);
        });  
    }

}

/* export the class */
exports.controller = LastfmController;
