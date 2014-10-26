/**
 * Band Repository
 * handles all db related functions for bands
 *
 * author: Mark Lewis
 */
var nconf = require('nconf');
var path = require('path');
var request = require('request');
var xml2js = require('xml2js');
var BaseRepository = require('./../repositories/BaseRepository.js');
var async = require('async');
var moment = require('moment');
var util = require('util');

/**
 * configuration
 */
nconf.file(path.join(__dirname, 'app/config/app.json'));


/**
 * constructor
 */
function BandRepository(args) {
    this.db = args.db;
    this.collection = 'bands';
    this.retentionValue = nconf.get('retention:value');
    this.retentionPeriod = nconf.get('retention:period');

    args.collection = this.collection;
 
    BaseRepository.call(this, args);
}

/**
 * base repo functions
 */
BandRepository.prototype.find = function(query, options, callback) {
    BaseRepository.prototype.find.call(this, query, options, function(err, bands) {
        callback(err, bands);
    });
}

BandRepository.prototype.findOne = function(query, callback) {
    BaseRepository.prototype.findOne.call(this, query, function(err, band) {
        callback(err, band);
    });
}

BandRepository.prototype.insert = function(band, options, callback) {
    band = this.addDefaultValues(band);
    BaseRepository.prototype.insert.call(this, band, options, function(err, band) {
        callback(err, band);
    });
}

BandRepository.prototype.update = function(query, value, options, callback) {
    BaseRepository.prototype.update.call(this, query, value, options, function(err, bands) {
        callback(err, bands);
    });
}

BandRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    BaseRepository.prototype.findAndModify.call(this, query, sort, value, options, function(err, bands) {
        callback(err, bands);
    });
}

BandRepository.prototype.remove = function(query, options, callback) {
    BaseRepository.prototype.remove.call(this, query, options, function(err, bands) {
        callback(err, bands);
    });
}

/**
 * Band specific functions
 */

// TODO: use mongodb to maintain schemas
BandRepository.prototype.addDefaultValues = function(band) {
    var emptyObject = {};
    var emptyArray = [];
    band.external_ids = {
        "lastfm_id": band.band_name,
        "facebook_id": "",
        "echonest_id": ""
    }
    band.failed_lookups = {
        "lastfm": 0,
        "facebook": 0,
        "echonest": 0
    }
    band.running_stats = {
        "facebook_likes": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "incremental": 0,
            "daily_stats": emptyArray
        },
        "lastfm_listeners": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "incremental": 0,
            "daily_stats": emptyArray
        }
    }
    if (!band.regions) {
        band.regions = emptyArray;
    }
    if (!band.genres) {
        band.genres = emptyArray;
    }
    band.mentions = emptyArray;
    band.mentions_total = 0;
    band.last_updated = new Date();
    return band;
}

BandRepository.prototype.clearRunningStats = function(band) {
    var emptyObject = {};
    var emptyArray = [];
    band.running_stats = {
        "facebook_likes": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "total_incremental": 0,
            "daily_stats": emptyArray
        },
        "lastfm_listeners": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "total_incremental": 0,
            "daily_stats": emptyArray
        }
    }
    band.last_updated = new Date();
    return band;
}

BandRepository.prototype.updateRunningStat = function(query, provider, stat, value, incremental, incrementalTotal, incrementalAvg, callback) {
    var db = this.db;
    var collection = this.collection
    var parent = this;
    var today = moment().format('YYYY-MM-DD');
    var now = moment().format('YYYY-MM-DD HH:mm:ss');

    // add toays stat with upsert to overwrite in case it was already collected today
    async.series({
        deleteToday: function(cb) {
            var runningStat = {};
            runningStat["running_stats." + stat + ".daily_stats"] = { "date":  today };
            var set = { $pull: runningStat };
            db.collection(collection).update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var runningStat = {};
            var setFields = {};

            // if this is an error, update the error and skip the stat
            if (typeof value == "string") {

                setFields["running_stats." + stat + ".error"] = value;
                setFields["failed_lookups." + provider] = 0;
                // TODO: reset failed_lookups to 0 here
                var set = {
                    $set: setFields
                }

            } else { 
                runningStat["running_stats." + stat + ".daily_stats"] = { "date":  today, "value": value, "incremental": incremental };
                setFields["running_stats." + stat + ".current"] = value;
                setFields["running_stats." + stat + ".incremental"] = incremental;
                setFields["running_stats." + stat + ".incremental_total"] = incrementalTotal;
                setFields["running_stats." + stat + ".incremental_avg"] = incrementalAvg;
                setFields["running_stats." + stat + ".last_updated"] = now;
                var set = { 
                    $addToSet: runningStat,
                    $set: setFields 
                };
            }

            db.collection(collection).update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {

            var expire = moment().subtract(parent.retentionPeriod, parent.retentionValue).format('YYYY-MM-DD');
            var expireStat = {};
            expireStat["running_stats." + stat + ".daily_stats"] = { "date":  { $lt:  expire }  };
            var set = { $pull: expireStat };
            
            db.collection('bands').update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
    },
    function(err, results) {
        callback(err, results);
    });

}

BandRepository.prototype.getBadLastfmIds = function(callback) {
    var db = this.db;
    var collection = this.collection;
    var query = {
        $or: [
            {"running_stats.lastfm_listeners.error": /^error.*/},
            {"running_stats.lastfm_listeners.error": {$type: 1 }} 
        ]
    };
    var options = {
        "band_name": 1,
        "band_id": 1,
        "external_ids.lastfm_id": 1,
        "running_stats.lastfm_listeners.current": 1
    };

    this.db.collection(collection).find(query, options).toArray(function(err, results) {
        if (err) {
            util.log(err);
            return false;
        }
       
        if (!results.length > 0) {
            callback('no bands found', null);
            return false;
        }

        callback(null, results);
    });
}


BandRepository.prototype.getBadFacebookIds = function(callback) {
    var db = this.db;
    var collection = this.collection;
    var query = {
        $or: [
            {"running_stats.facebook_likes.error": /^error.*/},
            {"running_stats.facebook_likes.error": {$type: 1 }} 
        ]
    };
    var options = {
        "band_name": 1,
        "band_id": 1,
        "external_ids.facebook_id": 1,
        "running_stats.facebook_likes.current": 1
    };

    this.db.collection(collection).find(query, options).toArray(function(err, results) {
        if (err) {
            util.log(err);
            return false;
        }
       
        if (!results.length > 0) {
            callback('no bands found', null);
            return false;
        }

        callback(null, results);
    });
}

BandRepository.prototype.getBandsIndex = function(query, callback) {
    var db = this.db;
    var collection = this.collection;

    this.db.collection(collection).find(query, {'band_name':1, 'band_id':1}).toArray(function(err, results) {
        if (err) {
            util.log(err);
            return false;
        }
       
        if (!results.length > 0) {
            callback('no bands found', null);
            return false;
        }

        callback(null, results);
    });

}

BandRepository.prototype.updateMentions = function(query, site, article, callback) {
    var db = this.db;
    var collection = this.collection;
    var today = moment().format('YYYY-MM-DD');
    var description = article[site['description_field']];
    var link = article[site['link_field']];
    var set = { 
        $addToSet: {   
            "mentions": { 
                "date": today,
                "site_id": site.site_id,
                "link": link, 
                "description": description 
            } 
        } 
    };
   
    // overwrite in case it was already collected today
    async.waterfall([
        function(cb) {
            var query = {
                "mentions.link": link
            };
            db.collection(collection).count(query, function(err, count) {
                if (count > 0) {
                    // dont need to do anything
                    cb("already saved");
                } else {
                    cb();
                }
            }); 
        },
        function(cb) {
            db.collection(collection).update(query, set, function(err, results) {
                if (err) {
                    cb(err);
                    return false;
                }
                cb();
            });
        },
        function(cb) {
            db.collection(collection).findOne(query, function(err, results) {
                var mentionsTotal = results.mentions.length;
                db.collection(collection).update(query, {$set: {"mentions_total": mentionsTotal}}, function(err, results) {
                    if (err) {
                        cb(err);
                        return false;
                    }
                    cb(err, results);
                });
            });
        }
    ],
    function(err, results) {
        if (err) {
            callback(err);
            return false;
        }
        callback(null, results);
    });
}

/**
 * Counts
 */
BandRepository.prototype.count = function(query, callback) {
    var db = this.db;
    var collection = this.collection;
    db.collection(collection).count(query, function(err, results) {
        if (err) {
            util.log(err);
            return false;
        }
       
        callback(null, results);
    });
}

BandRepository.prototype.getBadRunningStatCount = function(stat, callback) {
    var statId = "running_stats." + stat + ".error";
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

    this.count(query, function(err, results) {
        if (err) util.log(err);

        callback(err, results);
    });
}

BandRepository.prototype.findDuplicates = function(callback) {
    var db = this.db;
    var collection = this.collection;

    var map = function(){
        if(this.band_name) {
            emit(this.band_name, 1);
        }
    }

    var reduce = function(key, values){
        var result = 0;
        values.forEach(function(value) {
          result += value;
        });
        return result;
    }

    db.collection(collection).mapReduce(map, reduce, {out:{ inline : 1}}, function(err, results) { 
        var duplicates = [];
        if (err) {
            util.log(err);
            return false;
        }
    
        for (var r in results) {
            if (results[r].value > 1) {
                duplicates.push({
                    "band_name": results[r]._id,
                    "value": results[r].value
                });
            }
        }
        callback(null, duplicates);
    });
}

BandRepository.prototype.getDistinctValues = function(field, query, callback) {
    var db = this.db;
    var collection = this.collection;
    db.collection(collection).distinct(field, query, function(err, results) {
        if (err) util.log(err);

        callback(err, results);
    });
    
}

BandRepository.prototype.incrementFailedLookups = function(query, provider, callback) {
    var db = this.db;
    var collection = this.collection;
    var set = {};
    set["failed_lookups." + provider] = 1;
    db.collection(collection).update(query, {$inc: set}, {}, function(err, updated) {
        if (err) {
            console.log(err); 
        }
        callback(null, updated);
    });

}

module.exports = BandRepository;
