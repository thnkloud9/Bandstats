/**
 * Session Repository
 * handles all db related functions for sessions
 *
 * author: Mark Lewis
 */
var request = require('request');
var BaseRepository = require('./../repositories/BaseRepository.js');
var util = require('util');
var bcrypt = require('bcrypt');
/**
 * constructor
 */
function SessionRepository(args) {
    this.db = args.db;
    this.collection = 'sessions_';
    args.collection = this.collection;
 
    BaseRepository.call(this, args);
}

/**
 * base repo functions
 */
SessionRepository.prototype.find = function(query, options, callback) {
    BaseRepository.prototype.find.call(this, query, options, function(err, sessions) {
        callback(err, sessions);
    });
}

SessionRepository.prototype.findOne = function(query, callback) {
    BaseRepository.prototype.findOne.call(this, query, function(err, session) {
        callback(err, session);
    });
}

SessionRepository.prototype.insert = function(value, options, callback) {
    BaseRepository.prototype.insert.call(this, value, options, function(err, sessions) {
        callback(err, sessions);
    });
}

SessionRepository.prototype.update = function(query, value, options, callback) {
    BaseRepository.prototype.update.call(this, query, value, options, function(err, sessions) {
        callback(err, sessions);
    });
}

SessionRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    BaseRepository.prototype.findAndModify.call(this, query, sort, value, options, function(err, sessions) {
        callback(err, sessions);
    });
}

SessionRepository.prototype.remove = function(query, options, callback) {
    BaseRepository.prototype.remove.call(this, query, options, function(err, sessions) {
        callback(err, sessions);
    });
}

/**
 * Session specific functions
 */

module.exports = SessionRepository;
