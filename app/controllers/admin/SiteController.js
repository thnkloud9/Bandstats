/**
 * Site Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
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
    var parent = this;
    var data = this.data;
    var query = {};
    if (req.query.search) {
        search = new RegExp('.*' + req.query.search + '.*', 'i');
        query = {"site_name": search};
    }
    this.siteRepository.find(query, {}, function(err, sites) {
        _.extend(data, { 'sites': sites });
        var template = require(parent.viewPath + 'site_index');
        //res.send(template.render(data));
        res.send(data);
    });
}

SiteController.prototype.editAction = function(req, res) {
    var data = this.data;
    var query = {'site_id': req.params.id};
    var siteRepository = this.siteRepository;
    var template = require(this.viewPath + 'site_edit');
    _.extend(data, {json: {}});

    if (req.params.id === "0") {
        // this is a new record
        data.site = {};
        data.json.site = JSON.stringify({});
        res.send(template.render(data));
    } else {
        // get the record from the db
        this.siteRepository.findOne(query, function(err, site) {
            if ((err) || (!site)) {
                res.send({status: "error", error: "site not found"});
                return false;
            }
            delete site._id;
            data.site = site;
            data.json.site = JSON.stringify(site);
            res.send(template.render(data));
        });
    }
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
            res.send({status: "error", error: "site not found"});
            return false;
        }
        // get articles
        siteRepository.getNewArticles(site, function(err, meta, articles) {
                data.articles = articles;
                res.send(data);
        });
    });
    
}

SiteController.prototype.updateAction = function(req, res) {
    if ((req.route.method != "put") || (!req.body.values)) {
        res.send({status: "error", error: "update must be put action and must include values"});
        return false;
    }
    var query = {'site_id': req.params.id};
    var values = req.body.values;
    var siteRepository = this.siteRepository

    siteRepository.update(query, values, {}, function(err, updated) {
        if ((err) || (!updated)) {
            res.send({status: "error", error: err});
            return false;
        }
        // send updated site back
        res.send({status: "success", updated: updated});        
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
    this.siteRepository.insert(req.body.values, {}, function(err, site) {
        res.send({status: "success", site: site});
    });
}

/* export the class */
exports.controller = SiteController;
