/**
 * Site Repository
 * handles all db related functions for sites
 *
 * author: Mark Lewis
 */
var request = require('request');
var xml2js = require('xml2js');
var BaseRepository = require('./../repositories/BaseRepository.js');
var util = require('util');
var feedparser = require('feedparser');

/**
 * constructor
 */
function SiteRepository(args) {
    this.db = args.db;
    this.collection = 'sites';
    args.collection = this.collection;
 
    BaseRepository.call(this, args);
}

/**
 * base repo functions
 */
SiteRepository.prototype.find = function(query, options, callback) {
    BaseRepository.prototype.find.call(this, query, options, function(err, sites) {
        callback(err, sites);
    });
}

SiteRepository.prototype.findOne = function(query, callback) {
    BaseRepository.prototype.findOne.call(this, query, function(err, site) {
        callback(err, site);
    });
}

SiteRepository.prototype.insert = function(value, options, callback) {
    BaseRepository.prototype.insert.call(this, value, options, function(err, sites) {
        callback(err, sites);
    });
}

SiteRepository.prototype.update = function(query, value, options, callback) {
    BaseRepository.prototype.update.call(this, query, value, options, function(err, sites) {
        callback(err, sites);
    });
}

SiteRepository.prototype.findAndModify = function(query, sort, value, options, callback) {
    BaseRepository.prototype.findAndModify.call(this, query, sort, value, options, function(err, sites) {
        callback(err, sites);
    });
}

SiteRepository.prototype.remove = function(query, options, callback) {
    BaseRepository.prototype.remove.call(this, query, options, function(err, sites) {
        callback(err, sites);
    });
}

SiteRepository.prototype.count = function(query, callback) {
    BaseRepository.prototype.count.call(this, query, function(err, count) {
        callback(err, count);
    });
}

/**
 * Site specific functions
 */

/**
 * don't think this really belongs in the repository class,
 * but leaving it here for now.
 */
SiteRepository.prototype.getNewArticles = function(site, callback) {
    var parent = this;
    util.log(site.site_name + ' last entry was ' + site.last_entry);
    util.log(site.site_url);
    var req = {
        uri: site.site_url,
        headers: {
            'If-Modified-Since': site.last_entry
        }
    }
    feedparser.parseUrl(req, function(err, meta, articles) {
        // update site.last_entry so we don't reparse already read articles
        if (err || !meta) {
            callback(err);
        }
        // make sure we actually have real string values
        // for each article field
        var parsed_articles = [];
        for (var a in articles) {
            var article = articles[a];
            parsed_article = parent.sanitizeArticle(article);
            parsed_articles.push(parsed_article); 
        }
        callback(err, meta, parsed_articles);
    });
}

/**
 * sanitizes field names, removes html, and
 * attempts to match string values to each
 * article field
 */
SiteRepository.prototype.sanitizeArticle = function(article) {
    var parsed_article = {};
    for (var field in article) {
        var value = article[field];
        // get rid of html
        if ((typeof value === 'string') && (field != 'link')) {
            value = value.replace(/<.p>/gi, '')
                .replace(/<(?:.|\n)*?>/gi, '')
                .replace(/\n/gi, '')
                .replace(/[?\.\\,!\“\”\’\‘\"\'\(\)\[\]\{\}]/g, '')
                .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '')
                .replace(/<img.*>/gi, '');
        }

        //sanitize field names
        field = field.replace(/[\:\&\!\\\/\[\]\(\)\?]/g, '-');

        parsed_article[field] = value;
    }
    return parsed_article;
}

module.exports = SiteRepository;
