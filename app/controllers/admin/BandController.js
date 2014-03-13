/**
 * Band Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var nconf = require('nconf');
nconf.file(path.join(__dirname, 'app/config/app.json'));

var BandRepository = require('./../../repositories/BandRepository.js');

/**
 * constructor
 */
function BandController(db) {

    /**
     * Load the band repo for mongo connectivity
     */
    this.bandRepository = new BandRepository({'db': db});
    this.data = {"section": "band"};
    this.viewPath = "./../../views/";
}

/**
 * just render template for jquery datatables
 */
BandController.prototype.indexAction = function(req, res) {
    var data = this.data;
    var bandId = req.params.id;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {};
    var options = {};
    var parent = this;

    if (bandId) {
        query.band_id = bandId;
    }

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

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };
   
    this.bandRepository.count(query, function(err, count) { 
      parent.bandRepository.find(query, options, function(err, bands) {
        var results = {
          "totalRecords": count,
          "data": bands
        }
        if (bandId) {
          res.send(bands[0]);
        } else {
          res.send(results);
        }
      });
    });
} 

/**
 * simple list of bands and ids
 * used for typeahead and lookups
 */
BandController.prototype.listAction = function(req, res) {
    var data = this.data;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {};
    var options = {};

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

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };
   
    this.bandRepository.find(query, options, function(err, bands) {
        if (err) {
            util.log(JSON.stingify(err));
            res.send(err);
        }
        res.send(bands);
    });
} 


BandController.prototype.failedAction = function(req, res) {
    var data = this.data;
    var parent = this;
    // TODO get this list from nconf
    var running_stats = ['facebook_likes', 'lastfm_listeners'];

    // get number of failed ids for all running_stats 
    async.forEach(running_stats, function(stat, cb) {
        var countId = "failed_" + stat + "_count";
        parent.bandRepository.getBadRunningStatCount(stat, function(err, results) {
            var result = {};
            result[countId] = results;
            _.extend(data, result);
            cb(err);
        });
    },
    function (err) {
        var template = require(parent.viewPath + 'band_failed');
        //res.send(template.render(data));
        res.send(data);
    });
}

BandController.prototype.badLastfmIdsAction = function(req, res) {
    this.bandRepository.getBadLastfmIds(function(err, results) {
        res.send(results);

    }); 
}

BandController.prototype.badFacebookIdsAction = function(req, res) {
    this.bandRepository.getBadFacebookIds(function(err, results) {
        res.send(results);

    }); 
}

BandController.prototype.lookupsAction = function(req, res) {
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
        //res.send(template.render(data));
        res.send(data);
    });
}

BandController.prototype.editAction = function(req, res) {
    var data = this.data;
    var query = {'band_id': req.params.id};
    var bandRepository = this.bandRepository;
    var template = require(this.viewPath + 'band_edit');
    var apisEnabled = {
        "facebook": nconf.get('facebook:enabled'),
        "lastfm": nconf.get('lastfm:enabled'),
        "echonest": nconf.get('echonest:enabled'),
        "soundcloud": nconf.get('soundcloud:enabled'),
        "bandcamp": nconf.get('bandcamp:enabled'),
        "musicbrainz": nconf.get('musicbrainz:enabled'),
        "youtube": nconf.get('youtube:enabled'),
    }
    _.extend(data, {
        "json": {},
        "apis_enabled": apisEnabled 
    });

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

BandController.prototype.articlesAction = function(req, res) {
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

BandController.prototype.updateAction = function(req, res) {
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

BandController.prototype.removeAction = function(req, res) {
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

BandController.prototype.createAction = function(req, res) {
    if (req.route.method != "post") {
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

BandController.prototype.duplicatesAction = function(req, res) {
    var data = this.data;
    var parent = this;
    this.bandRepository.findDuplicates(function(err, results) {
        if (err) res.send(err);
        
        var finalResults = [];
        async.forEach(results, function(band, cb) {

            parent.bandRepository.find({"band_name": band.band_name}, {}, function(err, bandResults) {
                if (err) util.log(err);

                for (var b in bandResults) {
                    finalResults.push(bandResults[b]);
                }
                cb();
            }); 
        },
        function(err) {
            var template = require(parent.viewPath + 'band_duplicates');
            _.extend(data, { 
                "duplicates": finalResults,
                "duplicates_json": JSON.stringify(finalResults)
            });
            //res.send(template.render(data));
            res.send(data);
        });
    });
}

BandController.prototype.genresAction = function(req, res) {
    var parent = this;
    var data = this.data;

    this.bandRepository.getDistinctValues('genres', {}, function(err, genres) {
        if (err) util.log(err);

        res.send(genres);
    });
}

BandController.prototype.regionsAction = function(req, res) {
    var parent = this;
    var data = this.data;

    this.bandRepository.getDistinctValues('regions', {}, function(err, regions) {
        if (err) util.log(err);

        res.send(regions);
    });
}

/* export the class */
exports.controller = BandController;
