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
    var filter = req.query.filter;
    var sort = req.query.sort;
    var searchQuery = {};
    var filterQuery = {};
    var options = {};
    var parent = this;

    // if search requested search for band name, id, or external id
    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        searchQuery = {
            $or: [
                {"band_name": search},
                {"band_id": search},
                {"external_ids.facebook_id": search},
                {"band_url": search},
            ]
        };
    }

    // if filter add to query
    if (filter) {
        var filters = {};
	var andFilters = [];
	var orFilters = [];


	// different fields will be seperated by AND
	// different values for a given field will be
	// separated by OR 
        _.forEach(filter, function(values, field) {
	    var andFilter = {};
	    var orFilter = {};
	    orFilters = [];

            // see if multiple values were passed, use or
            if (typeof values === 'object') {
                _.forEach(values, function(value) {
                    var orFilter = {};
                    orFilter[field] = { $in: [ value ] };
                    orFilters.push(orFilter);  
                });
		var andFilter = {};
		andFilter = { $or: orFilters };
		andFilters.push(andFilter);
            } else {
                andFilter[field] = { $in: [ values ] };
                andFilters.push(andFilter);
            }

        });
      
	filterQuery = {
	    $and: andFilters
	}
    }

    
    // add sorting
    var orderby = {};
    if (sort) {
        _.forEach(sort, function(direction, field) {
            if (direction === "asc") {
                orderby[field] = 1; 
            } else {
                orderby[field] = -1; 
            }
        });
    }

    // make the ordered query
    var orderedQuery = {
        $query: { 
            $and: [ 
                searchQuery, 
                filterQuery 
            ]
        },
        $orderby: orderby
    };

    // unordered query for count
    var unorderedQuery = {
        $and: [
            searchQuery,
            filterQuery
        ]
    }

    // if this is for single band
    if (bandId) {
        unorderedQuery = { band_id: bandId };
        orderedQuery = { band_id: bandId };
    }

    // now add pager options, and remove _id
    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };

    // DEBUG
    util.log(JSON.stringify(orderedQuery));
   
    this.bandRepository.count(unorderedQuery, function(err, count) { 
      parent.bandRepository.find(orderedQuery, options, function(err, bands) {
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
        res.send(data);
    });
}

BandController.prototype.editAction = function(req, res) {
    var data = this.data;
    var query = {'band_id': req.params.id};
    var bandRepository = this.bandRepository;
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
            res.send(data);
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
        res.send(band.mentions);
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
            var results = {
                "totalRecords": finalResults.length,
                "data": finalResults
            }
            res.send(results);
        });
    });
}

BandController.prototype.genresAction = function(req, res) {
    var parent = this;
    var data = this.data;

    this.bandRepository.getDistinctValues('genres', {}, function(err, genres) {
        if (err) util.log(err);

        if (req.query.search) {
            var results = [];
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            async.forEach(genres, function(genre, cb) {
                if (search.test(genre)) {
                    results.push(genre);
                }
                cb();
            },
            function(err) {
                res.send(results);
                return true;
            });
        } else {
          res.send(genres);
        }
    });
}

BandController.prototype.regionsAction = function(req, res) {
    var parent = this;
    var data = this.data;

    this.bandRepository.getDistinctValues('regions', {}, function(err, regions) {
        if (err) util.log(err);

        if (req.query.search) {
            var results = [];
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            async.forEach(regions, function(region, cb) {
                if (search.test(region)) {
                    results.push(region);
                }
                cb();
            },
            function(err) {
                res.send(results);
                return true;
            });
        } else {
          res.send(regions);
        }

    });
}

/* export the class */
exports.controller = BandController;
