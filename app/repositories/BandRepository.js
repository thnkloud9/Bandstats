/**
 * Band Repository
 * handles all db related functions for bands
 *
 * author: Mark Lewis
 */
var request = require('request');
var xml2js = require('xml2js');
var BaseRepository = require('./../repositories/BaseRepository.js');
var async = require('async');
var moment = require('moment');
var util = require('util');

/**
 * constructor
 */
function BandRepository(args) {
    this.db = args.db;
    this.collection = 'bands';
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

BandRepository.prototype.insert = function(value, options, callback) {
    BaseRepository.prototype.insert.call(this, value, options, function(err, bands) {
        callback(err, bands);
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

BandRepository.prototype.updateRunningStat = function(query, stat, value, callback) {
    var db = this.db;
    var collection = this.collection
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
            runningStat["running_stats." + stat + ".daily_stats"] = { "date":  today, "value": value };
            setFields["running_stats." + stat + ".current"] = value;
            setFields["running_stats." + stat + ".last_udpated"] = now;
            var set = { 
                $addToSet: runningStat,
                $set: setFields 
            };
            
            db.collection(collection).update(query, set, {"multi":true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {
            var expire = moment().subtract('months', 6).calendar();
            var expireStat = {};
            expireStat["running_stats." + stat + ".daily_stats"] = { "date":  expire };
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

/**
 * inserts or updates facebook_likes daily_stats for
 * the current day, also cleans any records older than
 * 60 days
 */
BandRepository.prototype.updateFacebookLikes = function(query, likes, callback) {
    var db = this.db;
    var collection = this.collection
    var now = moment().format('YYYY-MM-DD HH:mm:ss');
    var likes = parseInt(likes);

    // add toays stat with upsert to overwrite in case it was already collected today
    async.series({
        deleteToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  today } } };
            db.collection(collection).update(query, set, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { 
                $addToSet: {"running_stats.facebook_likes.daily_stats": { "date": today, "value": likes } },
                $set: {
                    "running_stats.facebook_likes.current": likes,
                    "running_stats.facebook_likes.last_updated": now
                }
            };
            db.collection(collection).update(query, set, {upsert:true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {
            var expire = moment().subtract('months', 6).calendar();
            var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  expire } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
    },
    function(err, results) {
        callback(err, results);
    });
}

/**
 * inserts or updates lastfm_listeners daily_stats for
 * the current day, also cleans any records older than
 * 60 days
 */
BandRepository.prototype.updateLastfmListeners = function(query, listeners, callback) {
    var db = this.db;
    var collection = this.collection;
    var now = moment().format('YYYY-MM-DD HH:mm:ss');
    var listeners = parseInt(listeners);

    async.series({
        deleteToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $pull: {"running_stats.lastfm_listeners.daily_stats": { "date":  today } } };
            db.collection(collection).update(query, set, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { 
                $addToSet: {"running_stats.lastfm_listeners.daily_stats": { "date": today, "value": listeners } },
                $set: {
                    "running_stats.lastfm_listeners.current": listeners,
                    "running_stats.lastfm_listeners.last_updated": now 
                }
            };
            db.collection(collection).update(query, set, {upsert:true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {
            var expire = moment().subtract('months', 6).calendar();
            var set = { $pull: {"running_stats.lastfm_listeners.daily_stats": { "date":  expire } } };
            db.collection(collection).update(query, set, function(err, result) {
                cb(err, result);
            });
        },
    },
    function(err, results) {
        callback(err, results);
    });
};

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

};

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
    async.series({
        checkForOld: function(cb) {
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
        addNew: function(cb) {
            db.collection(collection).update(query, set, function(err, results) {
                if (err) {
                    cb(err);
                    return false;
                }
                cb(err, results);
            });
        },
    },
    function(err, results) {
        if (err) {
            callback(err);
            return false;
        }
        callback(null, results);
    });
};

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
};

module.exports = BandRepository;
