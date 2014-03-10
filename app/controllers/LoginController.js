/**
 * Login Controller
 *
 * login form and login post are defined in app/lib/Router.js
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
function LoginController(db) {

    /**
     * Load the user repo for mongo connectivity
     */
    this.userRepository = new UserRepository({'db': db});
    this.data = {"section": "user"};
}

LoginController.prototype.indexAction = function(req, res) {
    res.redirect('/#login');
}

LoginController.prototype.createAction = function(req, res) {
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

    // add default role and permissions fields
    user.role = "manager";
    user.active = false;

    // encrypt password
    this.userRepository.encryptPassword(user, function(err, encryptedUser) {
        // save user
        parent.userRepository.insert(user, {}, function(err, newUser) {
            res.send({status: "success", user: newUser});
            return true;
        });
    });
}

/* export the class */
exports.controller = LoginController;
