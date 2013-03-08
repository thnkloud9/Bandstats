/**
 * Job Repository
 * handles all db related functions for jobs
 *
 * author: Mark Lewis
 */
var request = require('request');
var fs = require('fs');
var util = require('util');
var async = require('async');
var BaseRepository = require('./../repositories/BaseRepository.js');

/**
 * constructor
 */
function JobRepository(args) {
    this.db = args.db;
    this.collection = 'jobs';
    args.collection = this.collection;
 
    BaseRepository.call(this, args);
}

/**
 * base repo functions
 */
JobRepository.prototype.find = function(query, options, callback) {
    BaseRepository.prototype.find.call(this, query, options, function(err, jobs) {
        callback(err, jobs);
    });
}

JobRepository.prototype.findOne = function(query, callback) {
    BaseRepository.prototype.findOne.call(this, query, function(err, job) {
        callback(err, job);
    });
}

JobRepository.prototype.insert = function(value, options, callback) {
    BaseRepository.prototype.insert.call(this, value, options, function(err, jobs) {
        callback(err, jobs);
    });
}

JobRepository.prototype.update = function(query, value, options, callback) {
    BaseRepository.prototype.update.call(this, query, value, options, function(err, jobs) {
        callback(err, jobs);
    });
}

JobRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    BaseRepository.prototype.findAndModify.call(this, query, sort, value, options, function(err, jobs) {
        callback(err, jobs);
    });
}

JobRepository.prototype.remove = function(query, options, callback) {
    BaseRepository.prototype.remove.call(this, query, options, function(err, jobs) {
        callback(err, jobs);
    });
}

/**
 * Job specific functions
 */
JobRepository.prototype.getAvailableCommands = function(callback) {
    var commands = [];
    fs.readdir(__dirname + '/../../bin/', function(err, files) {
        if (err) util.log(err);

        async.forEach(files, function(file, cb) {
            if (/.js$/.test(file)) {
                commands.push(file);
            }
            cb();
        }, 
        function(err, results) {
            callback(null, commands);
        });
    });
}

module.exports = JobRepository;
