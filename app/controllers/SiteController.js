/**
 * Site Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');
var xml2js = require('xml2js');

var SiteModule = require('./../modules/SiteModule.js');

/**
 * constructor
 */
var SiteController = function(db) {

    this.siteModule = new SiteModule({'db': db});

    this.indexAction = function(req, res) {
        var query = {};

        this.siteModule.find(query, function(err, sites) {
            var data = { 'sites': sites };
            var template = require('./../views/site_index');
            res.send(template.render(data));
        });
    }

    this.editAction = function(req, res) {
        var query = {'site_id': req.params.id};
        var siteModule = this.siteModule;

        this.siteModule.findOne(query, function(err, site) {
            var data = { 'site': site };
            var template = require('./../views/site_edit');
    
            // get articles
            siteModule.getSiteArticles(site, function(err, site, articles) {
                    var article_fields = [];
                    for (var field in articles[0]) {
                        article_fields.push(field);
                    } 
                    data.articles = JSON.stringify(articles);
                    data.first_article = articles[0];
                    data.article_fields = article_fields;
                    res.send(template.render(data));
            });
        });
    }
}

/* export the class */
exports.controller = SiteController;
