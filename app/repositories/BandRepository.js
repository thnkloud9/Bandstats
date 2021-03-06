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
var BandstatsUtils = require(path.join(__dirname, './../lib/BandstatsUtils.js'));
var async = require('async');
var _ = require('underscore');
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
    this.sumStats = nconf.get('stats:sum_stats');
    this.bandstatsUtils = new BandstatsUtils();
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
    var facebookId = (band.external_ids.facebook_id) ? band.external_ids.facebook_id : ""; 
    var spotifyId = (band.external_ids.spotify_id) ? band.external_ids.spotify_id : ""; 
    var lastfmId = (band.external_ids.lastfm_id) ? band.external_ids.lastfm_id : band.band_name; 
    var echonestId = (band.external_ids.echonest_id) ? band.external_ids.echonest_id : ""; 
    var mentionsId = (band.external_ids.mentions_id) ? band.external_ids.mentions_id : band.band_name; 
    band.external_ids = {
        "lastfm_id": lastfmId,
        "facebook_id": facebookId,
        "echonest_id": echonestId,
        "mentions_id": mentionsId,
        "spotify_id": spotifyId,
        "bandcamp_id": "",
        "twitter_id": ""
    }
    band.failed_lookups = {
        "lastfm": 0,
        "facebook": 0,
        "echonest": 0,
        "spotify": 0,
        "twitter": 0
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
        },
        "spotify_followers": {
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
    if (!band.contest_codes) {
        band.contest_codes = emptyArray;
    }
    band.article_matching = "true";
    band.mentions = emptyArray;
    band.mentions_total = 0;
    band.sum_current = 0;
    band.sum_incremental = 0;
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
        },
        "spotify_followers": {
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

    // add todays stat with upsert to overwrite in case it was already collected today
    async.series([
        // delete today
        function(cb) {
            var runningStat = {};
            runningStat["running_stats." + stat + ".daily_stats"] = { "date":  today };
            var set = { $pull: runningStat };
            db.collection(collection).update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
        // remove last tag
        function (cb) {
            var thisStat = stat;
            db.collection('bands').findOne(query, function(err, band, stat) {
                var runningStats = band.running_stats;
                // if the stat object doesn't exist, create it
                if (!runningStats[thisStat]) {
                    runningStats[thisStat] = {};
                }
                var dailyStats = runningStats[thisStat].daily_stats;
                for (var s in dailyStats) {
                    var dailyStat = dailyStats[s];
                    if (dailyStat.last) {
                        delete dailyStat.last;
                    }
                }
                var set = { $set: { "running_stats": runningStats }};
                db.collection(collection).update(query, set, {"multi":true}, function(err, result) { 
                    cb(err, result);
                });
            });
        },
        // update today
        function(cb) {
            var runningStat = {};
            var setFields = {};
            var incFields = {};

            // if this is an error, update the error and skip the stat
            if (typeof value == "string") {

                setFields["running_stats." + stat + ".error"] = value;
                incFields["failed_lookups." + provider] = 1;
                var set = {
                    $set: setFields,
                    $inc: incFields
                }

            } else { 
                runningStat["running_stats." + stat + ".daily_stats"] = { 
                    "date":  today, 
                    "value": value, 
                    "incremental": incremental, 
                    "last": true 
                };
                setFields["running_stats." + stat + ".current"] = value;
                setFields["running_stats." + stat + ".incremental"] = incremental;
                setFields["running_stats." + stat + ".incremental_total"] = incrementalTotal;
                setFields["running_stats." + stat + ".incremental_avg"] = incrementalAvg;
                setFields["running_stats." + stat + ".last_updated"] = now;
                setFields["running_stats." + stat + ".error"] = "";
                setFields["failed_lookups." + provider] = 0;
                var set = { 
                    $addToSet: runningStat,
                    $set: setFields 
                };
            }

            db.collection(collection).update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
        // update totals
        function (cb) {
            var thisStat = stat;
            db.collection('bands').findOne(query, function(err, band, stat) {
                var runningStats = band.running_stats;
                var sumCurrent = 0;
                var sumIncremental = 0;

                for (var s in runningStats) {
                    var runningStat = runningStats[s];
                    if (parent.sumStats) {
                        if (parent.sumStats.indexOf(s)) {
                            sumCurrent += runningStat.current;
                            sumIncremental += runningStat.incremental;
                        }
                    }
                }
                var set = { 
                    $set: { 
                        "sum_current": sumCurrent,
                        "sum_incremental": sumIncremental
                    }
                }
                db.collection(collection).update(query, set, {"multi":true}, function(err, result) { 
                    cb(err, result);
                });
            });
        },
        // delete old stats
        function(cb) {

            var expire = moment().subtract(parent.retentionValue, parent.retentionPeriod).format('YYYY-MM-DD');
            var expireStat = {};
            expireStat["running_stats." + stat + ".daily_stats"] = { "date":  { $lt:  expire }  };
            var set = { $pull: expireStat };
            
            db.collection('bands').update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
    ],
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

    this.db.collection(collection).find(query, {'external_ids.mentions_id': 1, 'band_name':1, 'band_id':1}).toArray(function(err, results) {
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
    var mentionScore = parseInt(1 * site.site_weight);
    var set = { 
        $addToSet: {   
            "mentions": { 
                "date": today,
                "site_id": site.site_id,
                "site_name": site.site_name,
                "mention_score": mentionScore,
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
                var retentionPeriod = nconf.get('retention:period');
                var retentionValue = nconf.get('retention:value');
                var minDate = moment().subtract(retentionValue, retentionPeriod);
                var mentionsThisPeriod = 0;
                var mentionsScoreThisPeriod = 0;
                var mentionsScoreTotal = 0;
                var mentionsTotal = results.mentions.length;

                for (m = 0; m < mentionsTotal; m++) {
                    var mention = results.mentions[m];
                    var mentionDate = moment(mention.date, "YYYY-MM-DD");
                    mentionsScoreTotal += mention.mention_score;
                    if (mentionDate.isAfter(minDate)) {
                        mentionsThisPeriod++;
                        mentionsScoreThisPeriod += mention.mention_score;
                    }
                }
                var set = {
                    "mentions_total": mentionsTotal,
                    "mentions_this_period": mentionsThisPeriod,
                    "mentions_score_total": mentionsScoreTotal,
                    "mentions_score_this_period": mentionsScoreThisPeriod
                }
                db.collection(collection).update(query, {$set: set}, function(err, results) {
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
    db.collection(collection).count(query, { allowDiskUse: true }, function(err, results) {
        if (err) {
            util.log(err);
            return false;
        }
       
        callback(null, results);
    });
}

BandRepository.prototype.getBadRunningStatCount = function(stat, callback) {
    var statId = "running_stats." + stat + ".error";
    var query = {};
    query[statId] = { $exists: true, $nin: [ "", null ] }

    this.count(query, function(err, results) {
        if (err) util.log(err);

        callback(err, results);
    });
}

BandRepository.prototype.countDuplicates = function(query, callback) {
    var db = this.db;
    var collection = this.collection;
    var duplicateBands = [];
    var previousBandName = '';
    var orderedQuery = {
        $query: query,
        $orderby: {
            band_name: 1
        }
    }

    db.collection(collection).find(orderedQuery, {band_name: 1}).toArray(function(err, bands) { 
        if (err) util.log(err);

        async.forEach(bands, function(band, cb) {
            if (band.band_name === previousBandName) {
                duplicateBands.push(band);
            }
            previousBandName = band.band_name;
            cb(err);
        },
        function (err) {
            callback(err, duplicateBands.length);
        });
    });
}

BandRepository.prototype.getDuplicatesIndex = function(query, callback) {
    var db = this.db;
    var collection = this.collection;
    var duplicateBands = [];
    var previousBandName = '';
    var orderedQuery = {
        $query: query,
        $orderby: {
            band_name: 1
        }
    }

    db.collection(collection).find(orderedQuery, {band_id: 1, band_name: 1}).toArray(function(err, bands) { 
        if (err) util.log(err);

        async.forEach(bands, function(band, cb) {
            if (band.band_name === previousBandName) {
                duplicateBands.push(band.band_id);
                duplicateBands.push(previousBandId);
            }
            previousBandId = band.band_id;
            previousBandName = band.band_name;
            cb(err);
        },
        function (err) {
            callback(err, duplicateBands);
        });
    });
}

BandRepository.prototype.findDuplicates = function(query, sort, skip, limit, callback) {
    var parent = this;
    var db = this.db;
    var collection = this.collection;

    parent.getDuplicatesIndex(query, function(err, duplicatesIndex) {
        var total = duplicatesIndex.length;
            
        var orderedQuery = {
            $query: {
                $and: [
                    query,
                    {'band_id': { $in: duplicatesIndex }}
                ]
            },
            $orderby: sort
        }
        var options = { 
            'limit': limit,
            'skip': skip
        }

        db.collection(collection).find(orderedQuery, options).toArray(function(err, bands) { 
            if (err) util.log(err);

            callback(err, bands, total);
        });
    });
}

BandRepository.prototype.sortBy = function(bands, field, direction) {
    var sorted = _.sortBy(bands, function(band) { 
        util.log(band[field]);
        return band[field]; 
    }); 
    if (direction === "asc") {
        return sorted;
    } else {
        return sorted.reverse();
    }
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

BandRepository.prototype.resolveLookups = function(results, provider, bandField, callback) {
    var db = this.db;
    var collection = this.collection;
    var bandstatsUtils = this.bandstatsUtils;
    var parent = this;

    // save results here
    async.forEach(results, function(result, rcb) {
        var bandId = result.band_id;
        var bandName = result.band_name;
        var search = result.search;
        var values = result.results;

        if (values) {

            var match = false;
            var sanitizedBandName = bandstatsUtils.sanitizeSearchString(bandName);
            var exact = new RegExp('^' + sanitizedBandName + '$', 'ig');
            var exactId = null;
            var exactName = null;
            for (var v in values) {
                var value = values[v];
                // if soundcloud use username instead of name
                if (provider === "soundcloud") {
                    value.name = value.username
                }
                if (value.name) {
                    var sanitizedValueName = bandstatsUtils.sanitizeSearchString(value.name);

                    if (sanitizedValueName.match(exact)) { 
                        match = true;
                        matchId = value.id;
                        matchName = value.name;
                        break;
                    }
                } 
            }

            if (match) {
                console.log('updating ' + bandName + ' using id ' + search + ' with ' + matchId + ' id and name ' + matchName);

                // save the record 
                var set = {};
                set[bandField] = matchId;
                
                parent.update({"band_id": bandId}, {$set: set}, {}, function(err, updated) {
                    if (err) {
                        console.log(err); 
                    }
                    rcb(null, updated);
                });
            } else {
                console.log('could not find match for ' + bandName);
                parent.incrementFailedLookups({"band_id": bandId}, provider, function(err, updated) {
                    if (err) {
                        console.log(err); 
                    }
                    rcb(null, updated);
                });
            }
        } else {
            console.log('could not find match for ' + bandName);
            parent.incrementFailedLookups({"band_id": bandId}, provider, function(err, updated) {
                if (err) {
                    console.log(err); 
                }
                rcb(null, updated);
            });
        }
         
    },
    function (err, finalResult) {
        console.log('finished ' + bandField + ' collection database updates');
        callback(err, finalResult);
    });

}

module.exports = BandRepository;
