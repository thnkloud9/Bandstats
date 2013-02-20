/**
 * Base Repository 
 * handles all common db related functions
 *
 * author: Mark Lewis
 */
var request = require('request');
var xml2js = require('xml2js');

/** 
 * TODO: add try catches and loggin
 */

/**
 * constructor
 */
function BaseRepository(args) {
    this.db = args.db;
    this.collection = args.collection;
}

BaseRepository.prototype.find = function(query, options, callback) {
    this.db.collection(this.collection).find(query, options).toArray(function(err, results) { 
        if (err) throw err;

        callback(null, results);
    });
}

BaseRepository.prototype.findOne = function(query, callback) {
    this.db.collection(this.collection).findOne(query, function(err, result) { 
        if (err) throw err;

        callback(null, result);
    });
}

BaseRepository.prototype.insert = function(values, options, callback) {
    var query = {"_id": this.collection};
    var update = { $inc: { seq: 1 }};
    var options = { new: true };
    var sort = {};
    var collection = this.collection;
    var db = this.db;

    // get a new sequential id first
    this.db.collection('counters').findAndModify(query, sort, update, options, function(err, result) {
        values[collection.replace(/s$/, "") + "_id"] = result.seq.toString();
        db.collection(collection).insert(values, options, function(err, results) {
            if (err) throw err;

            callback(null, results);
        });
    });
}

BaseRepository.prototype.update = function(query, value, options, callback) {
    this.db.collection(this.collection).update(query, value, options, function(err, results) {
        if (err) throw err;

        callback(null, results);
    });
}

/**
 * insert/update - if _id is set the record is updated else inserted
 */
BaseRepository.prototype.save = function(query, value, callback) {
    this.db.collection(this.collection).save(query, {$set: value}, {safe: true}, function(err, result) {
        if (err) throw err;

        callback(null, result);
    });
}

/**
 * all options are boolean:
 * remove - finds and removes, returns found objects but they are no longer in the db
 * new - returns the modified object in callback (default is false_
 * upsert - inserts if no record found (default false)
 */
BaseRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    this.db.collection(this.collection).findAndModify(query, sort, {$set: value}, options, function(err, results) {
        if (err) throw err;

        callback(null, results);
    });
}

BaseRepository.prototype.remove = function(query, options, callback) {
    this.db.collection(this.collection).remove(query, options, function(err, results) {
        if (err) throw err;

        callback(null, results);
    });
}

module.exports = BaseRepository;
