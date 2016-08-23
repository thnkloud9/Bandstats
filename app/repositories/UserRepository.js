/**
 * User Repository
 * handles all db related functions for users
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
function UserRepository(args) {
    this.db = args.db;
    this.collection = 'users';
    args.collection = this.collection;
 
    BaseRepository.call(this, args);
}

/**
 * base repo functions
 */
UserRepository.prototype.find = function(query, options, callback) {
    BaseRepository.prototype.find.call(this, query, options, function(err, users) {
        callback(err, users);
    });
}

UserRepository.prototype.findOne = function(query, callback) {
    BaseRepository.prototype.findOne.call(this, query, function(err, user) {
        callback(err, user);
    });
}

UserRepository.prototype.insert = function(value, options, callback) {
    BaseRepository.prototype.insert.call(this, value, options, function(err, users) {
        callback(err, users);
    });
}

UserRepository.prototype.update = function(query, value, options, callback) {
    BaseRepository.prototype.update.call(this, query, value, options, function(err, users) {
        callback(err, users);
    });
}

UserRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    BaseRepository.prototype.findAndModify.call(this, query, sort, value, options, function(err, users) {
        callback(err, users);
    });
}

UserRepository.prototype.remove = function(query, options, callback) {
    BaseRepository.prototype.remove.call(this, query, options, function(err, users) {
        callback(err, users);
    });
}

/**
 * User specific functions
 */
UserRepository.prototype.count = function(query, callback) {
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

UserRepository.prototype.encryptPassword = function(user, callback) {
    var parent = this;
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err);
 
        // hash the password using new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
 
            // override the cleartext password with the hashed one
            user.password = hash;
            callback(err, user);
        });
    }); 
}

UserRepository.prototype.validPassword = function(user, password, callback) {
    bcrypt.compare(password, user.password, function(err, isMatch) {
        callback(err, isMatch);
    });
};

module.exports = UserRepository;
