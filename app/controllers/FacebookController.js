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
            res.send(results);
        });
    };

};

/* export the class */
exports.controller = FacebookController;
