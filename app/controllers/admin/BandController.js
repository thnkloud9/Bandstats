/**
 * Band Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var xml2js = require('xml2js');

var BandRepository = require('./../../repositories/BandRepository.js');

/**
 * constructor
 */
var BandController = function(db) {

    /**
     * Load the band repo for mongo connectivity
     */
    this.bandRepository = new BandRepository({'db': db});
    this.data = {"section": "band"};
    this.viewPath = "./../../views/";
    /**
     * just render template for jquery datatables
     */
    this.indexAction = function(req, res) {
        var data = this.data;
        var template = require(this.viewPath + 'band_index');
        res.send(template.render(_.extend(data, {"search": req.query.search})));
    } 

    /**
     * server-side implementation to support
     * jquery datatables plugin for mongoskin
     */
    this.bandsAction = function(req, res) {
        var data = this.data;
        var query = {};
        var parent = this;
        var displayLength = req.query.iDisplayLength;
        var displayStart = req.query.iDisplayStart;
        var numDisplayColumns = req.query.iColumns;
        var numSortColumns = req.query.iSortingCols;
        var sEcho = req.query.sEcho;
 
        if (req.query.search) {
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            query = {
                $or: [
                    {"band_name": search},
                    {"band_id": search},
                    {"external_ids.facebook_id": search},
                    {"band_url": search},
                ]
            };
        }

        // if quey is present, override search
        if (req.query.query) {
            query = query;
        }

        var options = {
            "limit": displayLength,
            "skip": displayStart,
            "_id": 0
        };
        
        // add display columns
        for (var c=0; c<=numDisplayColumns; c++) {
            options[req.query['mDataProp_'+c]] = 1;
        }

        // add sorting
        var orderby = {};
        for (var s=0; s<numSortColumns; s++) {
            var columnName = req.query['mDataProp_'+req.query['iSortCol_'+s]];
            if (req.query['sSortDir_'+s] === 'asc') {
                var direction = 1;
            } else {
                var direction = -1;
            }
            orderby[columnName] = direction;
        }

        // make the ordered query
        var orderedQuery = {
            $query: query,
            $orderby: orderby
        }

        this.bandRepository.count(query, function(err, count) {
            parent.bandRepository.find(orderedQuery, options, function(err, bands) {
                var results = {
                    "sEcho": sEcho,
                    "iTotalRecords": count,
                    "iTotalDisplayRecords": count,
                    "bands": bands
                }
                res.send(results);
            });
        });
    }

    this.failedAction = function(req, res) {
        var data = this.data;
        var parent = this;
        // TODO get this list from nconf
        var running_stats = ['facebook_likes', 'lastfm_listeners'];

        // get number of failed ids for all running_stats 
        async.forEach(running_stats, function(stat, cb) {
            var statId = "running_stats." + stat + ".current";
            var countId = "failed_" + stat + "_count";
            var errorQuery = {};
            var stringQuery ={};
            errorQuery[statId] = /^error.*/;
            stringQuery[statId] = {$type: 1};

            var query = {
                $or: [
                    errorQuery,
                    stringQuery 
                ]
            };

            parent.bandRepository.count(query, function(err, results) {
                var result = {};
                result[countId] = results;
                _.extend(data, result);
                cb(err);
            });
        },
        function (err) {
            var template = require(parent.viewPath + 'band_failed');
            res.send(template.render(data));
        });
    }

    this.badLastfmIdsAction = function(req, res) {
        this.bandRepository.getBadLastfmIds(function(err, results) {
            res.send(results);

        }); 
    }

    this.badFacebookIdsAction = function(req, res) {
        this.bandRepository.getBadFacebookIds(function(err, results) {
            res.send(results);

        }); 
    }

    this.lookupsAction = function(req, res) {
        var data = this.data;
        var parent = this;
        // TODO get this list from nconf
        var apis = ['facebook', 'lastfm', 'musicbrainz', 'soundcloud', 'bandcamp', 'echonest'];

        // get number of missing ids for all external apis
        async.forEach(apis, function(api, cb) {
            var apiId = "external_ids." + api + "_id";
            var countId = "missing_" + api + "_count";
            var emptyQuery = {};
            var nullQuery ={};
            emptyQuery[apiId] = "";
            nullQuery[apiId] = null;

            var query = {
                $or: [
                    emptyQuery,
                    nullQuery 
                ]
            };
            parent.bandRepository.count(query, function(err, results) {
                var result = {};
                result[countId] = results;
                _.extend(data, result);
                cb(err);
            });
        },
        function (err) {
            var template = require(parent.viewPath + 'band_lookups');
            res.send(template.render(data));
        });
    }

    this.editAction = function(req, res) {
        var data = this.data;
        var query = {'band_id': req.params.id};
        var bandRepository = this.bandRepository;
        var template = require(this.viewPath + 'band_edit');
        _.extend(data, {json: {}});

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
        var data = this.data;
        var query = {'band_id': req.params.id};
        var bandRepository = this.bandRepository;

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

        bandRepository.update(query, {$set: values}, {"multi": true}, function(err, updated) {
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
