/**
 * Site Modules
 * handles all db related functions for sites
 *
 * author: Mark Lewis
 */
var request = require('request');
var xml2js = require('xml2js');

/**
 * constructor
 */
function SiteModule(args) {
    this.args = args;
    this.db = args.db;
}

SiteModule.prototype.find = function(query, callback) {
    this.db.collection('sites').find(query).toArray(function(err, sites) { 
        if (err) throw err;

        callback(null, sites);
    });
}

SiteModule.prototype.findOne = function(query, callback) {
    this.db.collection('sites').findOne(query, function(err, site) { 
        if (err) throw err;

        callback.call(this, null, site);
    });
}

SiteModule.prototype.getSiteArticles = function(site, callback) {
    var parent = this;
    console.log('getting articles from ' + site.site_url);
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
                        console.log(results);
                        console.log('could not parse response from ' + site.site_url);
                        process.exit(1);
                    }
                } else {
                    console.log(results);
                    console.log('could not parse response from ' + site.site_url);
                    process.exit(1);
                }
                
                // make sure we actually have real string values
                // for each article field
                var parsed_articles = [];
                for (var a in articles) {
                    var article = articles[a];
                    parsed_article = parent.sanitizeArticle(article);
                    parsed_articles.push(parsed_article); 
                }

                callback(null, site, parsed_articles);
            });
        } else {
            console.log('could not get ' + site.site_url + ', statusCode: '+response.statusCode);
            process.exit(1);
        }
    }); 
}

/**
 * sanitizes field names, removes html, and
 * attempts to match string values to each
 * article field
 */
SiteModule.prototype.sanitizeArticle = function(article) {
    var parsed_article = {};
    for (var field in article) {
        var value = article[field];
        if (typeof value === 'object') {
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

        // get rid of html
        if (typeof value === 'string') {
            value = value.replace(/<.p>/gi, '')
                .replace(/<(?:.|\n)*?>/gm, '')
                .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '')
                .replace(/<img.*>/gi, '');
        }

        //sanitize field names
        field = field.replace(/[\:\&\!\\\/\[\]\(\)\?]/g, '-');

        parsed_article[field] = value;
    }
    return parsed_article;
}

module.exports = SiteModule;
