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

/**
 * Site specific functions
 */

/**
 * TODO: move to a RSSManager class?
 * don't think this really belongs in the repository class,
 * but leaving it here for now.
 */
SiteRepository.prototype.getNewArticles = function(site, callback) {
    var parent = this;
    util.log('getting articles from ' + site.site_url);
    var options = {
        url: site.site_url,
    };
    request(options, function(err, response, body) {
        if (err) throw err;
        
        if (response.statusCode == 200) {
            // convert xml to json
            var parser = new xml2js.Parser();
            parser.parseString(body, function(err, results) { 
                var articles = [];

                /**
                 * TODO: find out if there is a better way to parse rss items
                 */
                if (results.rss) {
                    for (var i in results.rss.channel) {
                        var items = results.rss.channel[i];
                        for (var a in items.item) {
                            var article = items.item[a];
                            articles.push(article);
                        }
                    }
                } else if (results['rdf:RDF']) {
                    for (var i in results['rdf:RDF']['item']) {
                        var article = results['rdf:RDF']['item'][i];
                        articles.push(article);
                    }

                } else if (results.feed) {
                    if (results.feed.entry) {
                        for (var a in results.feed.entry) {
                            var article = results.feed.entry[a];
                            articles.push(article);
                        }
                    } else {
                        callback('could not parse response from ' + site.site_url);
                        return false;
                    }
                } else {
                    callback('could not parse response from ' + site.sit_url);
                    return false;
                }
                
                // make sure we actually have real string values
                // for each article field
                var parsed_articles = [];
                for (var a in articles) {
                    var article = articles[a];
                    parsed_article = parent.sanitizeArticle(article);
                    parsed_articles.push(parsed_article); 
                }

                callback(null, parsed_articles);
            });
        } else {
            callback('could not get ' + site.site_url + ', statusCode: '+ response.statusCode)
        }
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
        if (typeof value === 'object') {
            if (value[0]) { 
                if (typeof value[0]['_'] === 'string') {
                    value = value[0]['_'];
                } else {
                    if (typeof value === 'string') {
                        continue;
                    }
                    for (var i in value) {
                        if (typeof value[i] === 'string') {
                            value = value[i];
                            continue;
                        } else {
                            for (var j in value[i]) {
                                if (typeof value[i][j] === 'string') {
                                    value = value[i][j];
                                    continue;
                                }
                            }
                        } 
                        //console.log("NEED TO PARSE " + field + ' = ' + value);
                    }
                }
            }
        }

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
