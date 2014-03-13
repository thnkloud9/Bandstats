/**
 * User Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var util = require('util');

var UserRepository = require('./../../repositories/UserRepository.js');

/**
 * constructor
 */
function UserController(db) {

    /**
     * Load the user repo for mongo connectivity
     */
    this.userRepository = new UserRepository({'db': db});
    this.data = {"section": "user"};
}

UserController.prototype.indexAction = function(req, res) {
    // forward POST, PUT, and DELETE request to appropriate actions
    if (req.route.method == "post") {
      this.createAction(req, res);
    }

    if (req.route.method == "put") {
      this.updateAction(req, res);
    }

    if (req.route.method == "delete") {
      this.removeAction(req, res);
    }

    var parent = this;
    var userId = req.params.id;
    var data = this.data;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {};
    var options = {};
    var parent = this;

    if (userId) {
        query.user_id = userId;
    }

    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        query = {"username": search};
    }

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };

    this.userRepository.count(query, function(err, count) { 
      parent.userRepository.find(query, {}, function(err, users) {
        var results = {
          "totalRecords": count,
          "data": users
        }
        if (userId) {
          res.send(users[0]);
        } else {
          res.send(results);
        }
      });
    });
}

UserController.prototype.editAction = function(req, res) {
    var data = this.data;
    var query = {'user_id': req.params.id};
    var userRepository = this.userRepository;
    var template = require(this.viewPath + 'user_edit');
    _.extend(data, {json: {}});

    if (req.params.id === "0") {
        // this is a new record
        data.user = {};
        data.json.user = JSON.stringify({});
        res.send(template.render(data));
    } else {
        // get the record from the db
        this.userRepository.findOne(query, function(err, user) {
            if ((err) || (!user)) {
                res.send({status: "error", error: "user not found"});
                return false;
            }
            delete user._id;
            data.user = user;
            data.json.user = JSON.stringify(user);
            res.send(template.render(data));
        });
    }
}

UserController.prototype.updateAction = function(req, res) {
    if (req.route.method != "put") {
        res.send({status: "error", error: "update must be put action and must include values"});
        return false;
    }
    var query = {'user_id': req.params.id};
    var user = req.body;
    var userRepository = this.userRepository

    // delete _id to avoid errors
    delete user._id;

    userRepository.update(query, user, {}, function(err, updated) {
        if ((err) || (!updated)) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500);
            res.send();
            return false;
        }
        // send updated user back
        util.log('updated user ' + user.user_id);
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send();
    });
}

UserController.prototype.removeAction = function(req, res) {
    if ((req.route.method != "delete") || (!req.params.id)) {
        var data = {
            status: "error",
            error: "remove must be delete action and must be called from a user resource",
            method: req.route.method,
            id: req.params.id
        };
        res.send(data);
    }
    var query = {'user_id': req.params.id};
    
    this.userRepository.remove(query, {safe: true}, function(err, removed) {
        if ((err) || (!removed)) {
            res.send({status: "error", error: err});
            return false;
        }
        res.send({status: "success", id: req.params.id, removed: removed});
    });
}

UserController.prototype.createAction = function(req, res) {
    if (req.route.method != "post") {
        var data = {
            status: "error",
            error: "insert must be post action and must include values",
            method: req.route.method,
            values: req.body 
        };
        util.log('error saving new user: ' + JSON.stringify(data));
        res.setHeader('Content-Type', 'application/json');
        res.status(500);
        res.send(data);
    }    
    this.userRepository.insert(req.body, {}, function(err, user) {
        util.log('saving new user: ' + user.user_id);
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send();
    });
}

/* export the class */
exports.controller = UserController;
