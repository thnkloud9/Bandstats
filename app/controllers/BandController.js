/**
 * Band Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var xml2js = require('xml2js');

var BandRepository = require('./../repositories/BandRepository.js');

/**
 * constructor
 */
var BandController = function(db) {

    /**
     * Load the band repo for mongo connectivity
     */
    this.bandRepository = new BandRepository({'db': db});

    this.indexAction = function(req, res) {
        var query = {};
        if (req.query.search) {
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            query = {"band_name": search};
        }
        this.bandRepository.find(query, function(err, bands) {
            var data = { 'bands': bands };
            var template = require('./../views/band_index');
            res.send(template.render(data));
        });
    }

    this.editAction = function(req, res) {
        var query = {'band_id': req.params.id};
        var bandRepository = this.bandRepository;
        var template = require('./../views/band_edit');
        var data = {json: {}};

        if (req.params.id === "0") {
            // this is a new record
            data.band = {};
            data.json.band = JSON.stringify({});
            res.send(template.render(data));
        } else {
            // get the record from the db
            this.bandRepository.findOne(query, function(err, band) {
                if ((err) || (!band)) {
                    res.send({status: "error", error: "band not found"});
                    return false;
                }
                delete band._id;
                data.band = band;
                data.json.band = JSON.stringify(band);
                res.send(template.render(data));
            });
        }
    }

    this.articlesAction = function(req, res) {
        var query = {'band_id': req.params.id};
        var bandRepository = this.bandRepository;
        var data = {};

        this.bandRepository.findOne(query, function(err, band) {
            if ((err) || (!band)) {
                res.send({status: "error", error: "band not found"});
                return false;
            }
            // get articles
            bandRepository.getBandArticles(band, function(err, band, articles) {
                    data.articles = articles;
                    res.send(data);
            });
        });
        
    }

    this.updateAction = function(req, res) {
        if ((req.route.method != "put") || (!req.body.values)) {
            res.send({status: "error", error: "update must be put action and must include values"});
            return false;
        }
        var query = {'band_id': req.params.id};
        var values = req.body.values;
        var bandRepository = this.bandRepository

        bandRepository.update(query, values, function(err, updated) {
            if ((err) || (!updated)) {
                res.send({status: "error", error: err});
                return false;
            }
            // send updated band back
            res.send({status: "success", updated: updated});        
        });

    }

    this.removeAction = function(req, res) {
        if ((req.route.method != "delete") || (!req.params.id)) {
            var data = {
                status: "error",
                error: "remove must be delete action and must be called from a band resource",
                method: req.route.method,
                id: req.params.id
            };
            res.send(data);
        }
        var query = {'band_id': req.params.id};
        
        this.bandRepository.remove(query, {safe: true}, function(err, removed) {
            if ((err) || (!removed)) {
                res.send({status: "error", error: err});
                return false;
            }
            res.send({status: "success", id: req.params.id, removed: removed});
        });
    }

    this.createAction = function(req, res) {
        if ((req.route.method != "post") || (!req.body.values)) {
            var data = {
                status: "error",
                error: "insert must be post action and must include values",
                method: req.route.method,
                values: req.body.values 
            };
            res.send(data);
        }    
        this.bandRepository.insert(req.body.values, {}, function(err, band) {
            res.send({status: "success", band: band});
        });
    }
}

/* export the class */
exports.controller = BandController;
