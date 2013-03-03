/**
 * Login Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');

var UserRepository = require('./../repositories/UserRepository.js');

/**
 * constructor
 */
var LoginController = function(db) {

    /**
     * Load the user repo for mongo connectivity
     */
    this.userRepository = new UserRepository({'db': db});
    this.data = {"section": "user"};

    // show the login form
    this.indexAction = function(req, res) {
        var data = this.data;
        var template = require('./../views/login');
        res.send(template.render(data));
    }

    this.loginAction = function(req, res) {
        if ((req.route.method != "post") || (!req.body)) {
            var data = {
                status: "error",
                error: "insert must be post action and must include values",
                method: req.route.method,
                body: req.body
            };
            res.send(data);
        }
        var parent = this;
        var query = {
            "username": req.body.username
        }
        this.userRepository.findOne(query, function(err, user) {
            if ((err) || (!user)) {
               res.send({status: "error", error: "user not found"});
               return false;
            }
            parent.userRepository.validPassword(user, req.body.password, function(err, isMatch) {
                if (isMatch) {
                    res.send('passwords matched');
                } else {
                    var data = {
                        status: "error",
                        error: "incorrect password",
                        method: req.route.method,
                        body: req.body
                    };
                    res.send(data);
                }
            });
        }); 
    }

    this.registerAction = function(req, res) {
        var userRepository = this.userRepository;
        var data = this.data;
        var template = require('./../views/register');
        res.send(template.render(data));
    }

    this.createAction = function(req, res) {
        var parent = this;
        if ((req.route.method != "post") || (!req.body)) {
            var data = {
                status: "error",
                error: "insert must be post action and must include values",
                method: req.route.method,
                values: req.body.values 
            };
            res.send(data);
        }
        var user = (req.body);
        delete user['confirm-password'];
 
        // encrypt password
        this.userRepository.encryptPassword(user, function(err, encryptedUser) {
            parent.userRepository.insert(user, {}, function(err, newUser) {
                res.send({status: "success", user: newUser});
                return true;
            });
        });
    }
}

/* export the class */
exports.controller = LoginController;
