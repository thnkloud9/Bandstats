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
BandRepository.prototype.find = function(query, callback) {
    BaseRepository.prototype.find.call(this, query, function(err, bands) {
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

BandRepository.prototype.update = function(query, value, callback) {
    BaseRepository.prototype.update.call(this, query, value, function(err, bands) {
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

/**
 * inserts or updates facebook_likes daily_stats for
 * the current day, also cleans any records older than
 * 60 days
 */
BandRepository.prototype.updateFacebookLikes = function(query, likes, callback) {
    var db = this.db;

    // add toays stat with upsert to overwrite in case it was already collected today
    async.series({
        deleteToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  today } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $addToSet: {"running_stats.facebook_likes.daily_stats": { "date": today, "value": likes } } };
            db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
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

    async.series({
        deleteToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $pull: {"running_stats.lastfm_listeners.daily_stats": { "date":  today } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $addToSet: {"running_stats.lastfm_listeners.daily_stats": { "date": today, "value": listeners } } };
            db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {
            var expire = moment().subtract('months', 6).calendar();
            var set = { $pull: {"running_stats.lastfm_listeners.daily_stats": { "date":  expire } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
    },
    function(err, results) {
        callback(err, results);
    });
};
module.exports = BandRepository;
