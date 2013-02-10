/**
 * Band Repository
 * handles all db related functions for bands
 *
 * author: Mark Lewis
 */
var request = require('request');
var xml2js = require('xml2js');
var BaseRepository = require('./../repositories/BaseRepository.js');

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

module.exports = BandRepository;
