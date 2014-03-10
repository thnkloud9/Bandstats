/**
 * Session Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');

var SessionRepository = require('./../../repositories/SessionRepository.js');

/**
 * constructor
 */
function SessionController(db) {

    /**
     * Load the session repo for mongo connectivity
     */
    this.sessionRepository = new SessionRepository({'db': db});
    this.data = {"section": "session"};
}

SessionController.prototype.indexAction = function(req, res) {
    var sessionId = req.params.id;
    var data = this.data;
    var query = {};

    if (sessionId) {
        query.session_id = sessionId;
    }

    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        query = {"session_name": search};
    }

    this.sessionRepository.find(query, {}, function(err, sessions) {
        res.send(sessions);
    });
}

SessionController.prototype.updateAction = function(req, res) {
    if ((req.route.method != "put") || (!req.body.values)) {
        res.send({status: "error", error: "update must be put action and must include values"});
        return false;
    }
    var query = {'session_id': req.params.id};
    var values = req.body.values;
    var sessionRepository = this.sessionRepository

    sessionRepository.update(query, values, {}, function(err, updated) {
        if ((err) || (!updated)) {
            res.send({status: "error", error: err});
            return false;
        }
        // send updated session back
        res.send({status: "success", updated: updated});        
    });

}

SessionController.prototype.currentAction = function(req, res) {
    var currentUser = req.user;
    var currentSession = req.session;
    var query = {};
    var data = {
        user: currentUser,
        session: currentSession
    }

    this.sessionRepository.find(query, {}, function(err, sessions) {
        res.send(data);
    });
}

SessionController.prototype.removeAction = function(req, res) {
    if ((req.route.method != "delete") || (!req.params.id)) {
        var data = {
            status: "error",
            error: "remove must be delete action and must be called from a session resource",
            method: req.route.method,
            id: req.params.id
        };
        res.send(data);
    }
    var query = {'session_id': req.params.id};
    
    this.sessionRepository.remove(query, {safe: true}, function(err, removed) {
        if ((err) || (!removed)) {
            res.send({status: "error", error: err});
            return false;
        }
        res.send({status: "success", id: req.params.id, removed: removed});
    });
}

/* export the class */
exports.controller = SessionController;
