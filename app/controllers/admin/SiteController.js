/**
 * Site Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var util = require('util');
var async = require('async');
var _ = require('underscore');

var SiteRepository = require('./../../repositories/SiteRepository.js');

/**
 * constructor
 */
function SiteController(db) {

    /**
     * Load the site repo for mongo connectivity
     */
    this.siteRepository = new SiteRepository({'db': db});
    this.data = {"section": "site"};
    this.viewPath = "./../../views/";
}

SiteController.prototype.indexAction = function(req, res) {
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
    var siteId = req.params.id;
    var data = this.data;
    var limit = req.query.limit;
    var skip = req.query.skip;
    var query = {};

    if (siteId) {
        query.site_id = siteId;
    }

    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        query = {"site_name": search};
    }

    var options = {
        "limit": limit,
        "skip": skip,
        "_id": 0
    };

    this.siteRepository.count(query, function(err, count) {
      parent.siteRepository.find(query, options, function(err, sites) {

        var results = {
          "totalRecords": count,
          "data": sites
        }

        if (siteId) {
          res.send(sites[0]);
        } else {
          res.send(results);
        }
      });
    });
}

SiteController.prototype.countAction = function(req, res) {
    this.siteRepository.count({}, function(err, count) {
        res.send({"count": count});
    });
}

SiteController.prototype.metaAction = function(req, res) {
    var query = {'site_id': req.params.id};
    var siteRepository = this.siteRepository;
    var data = this.data;

    this.siteRepository.findOne(query, function(err, site) {
        if ((err) || (!site)) {
            res.send({status: "error", error: "site not found"});
            return false;
        }
        // get site metadata
        siteRepository.getNewArticles(site, function(err, meta, articles) {
                res.send(meta);
        });
    });
    
}

SiteController.prototype.articlesAction = function(req, res) {
    var query = {'site_id': req.params.id};
    var siteRepository = this.siteRepository;
    var data = this.data;

    this.siteRepository.findOne(query, function(err, site) {
        if ((err) || (!site)) {
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            res.send({status: "error", error: "site not found"});
            return false;
        }
        // get articles
        siteRepository.getNewArticles(site, function(err, meta, articles) {
                if (err) {
                    // TODO: fix this so returning an error here doesn't kill the node process
                    //res.setHeader('Content-Type', 'application/json');
                    //res.status(200);
                    //res.send({status: "error", error: err});
                    return false;
                }

                data.articles = articles;
                res.send(data);
        });
    });
    
}

SiteController.prototype.updateAction = function(req, res) {
    if (req.route.method != "put") {
        res.send({status: "error", error: "update must be put action and must include values"});
        return false;
    }
    var query = {'site_id': req.params.id};
    var site = req.body;
    var siteRepository = this.siteRepository

    delete site._id;

    siteRepository.update(query, site, {}, function(err, updated) {
        if ((err) || (!updated)) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500);
            res.send();
            return false;
        }
        // send updated site back   
        util.log('updated site ' + site.site_id);
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send();
    });

}

SiteController.prototype.removeAction = function(req, res) {
    if ((req.route.method != "delete") || (!req.params.id)) {
        var data = {
            status: "error",
            error: "remove must be delete action and must be called from a site resource",
            method: req.route.method,
            id: req.params.id
        };
        res.send(data);
    }
    var query = {'site_id': req.params.id};
    
    this.siteRepository.remove(query, {safe: true}, function(err, removed) {
        if ((err) || (!removed)) {
            res.send({status: "error", error: err});
            return false;
        }
        res.send({status: "success", id: req.params.id, removed: removed});
    });
}

SiteController.prototype.createAction = function(req, res) {
    if ((req.route.method != "post") || (!req.body.values)) {
        var data = {
            status: "error",
            error: "insert must be post action and must include values",
            method: req.route.method,
            values: req.body.values 
        };
        res.send(data);
    }    
    this.siteRepository.insert(req.body, {}, function(err, site) {
        res.send({status: "success", site: site});
    });
}

/* export the class */
exports.controller = SiteController;
