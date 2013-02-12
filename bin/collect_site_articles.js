#!/usr/bin/env node
/**
 * command line utility to collect facebook graph statistics
 *
 * Author: Mark Lewis
 */

/**
 *  module requires
 */
var program = require('commander');
var request = require('request');
var async = require('async');
var moment = require('moment');
var xml2js = require('xml2js');

var SiteRepository = require('./../app/repositories/SiteRepository.js');
var BandRepository = require('./../app/repositories/BandRepository.js');

var db = require('mongoskin').db('localhost:27017', {
  database: 'bandstats',
  safe: true,
  strict: false,
});

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-i, --site_id <site_id>', 'site id (numeric)')
    .option('-n, --site_name <site_name>', 'site name')

/**
 * update commands
 */
program
    .command('update')
    .description('gets new articles from site, checks all bands for matches and saves matches in mongo')
    .action(function() {
        console.log('updating');
        if (program.site_id) {
            var query = { 'site_id': program.site_id };
        } else if (program.site_name) {
            var query = { 'site_name': program.site_name };
        } else {
            // process all sites
            var query = {'site_url': {$ne: ''}};
            getSite(query, function(err, sites) {
                for (var s in sites) {
                    var site = sites[s];
                    var processed = 0;
                    parseSiteArticles(site, true, function() {
                        console.log('processing ' + site.site_name);
                        processed++;
                        if (processed == sites.length) { 
                            process.exit(1);
                        }
                    });
                }
            });
        }
    
        getSite(query, function(err, site) {
            parseSiteArticles(site, function() {
                process.exit(1);
            });
        });
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new articles sites, checks all bands for matches, display matches, but does not save matches in mongo')
    .action(function() {
        if (program.site_id) {
            var query = { 'site_id': program.site_id };
        } else if (program.site_name) {
            var query = { 'site_name': program.site_name };
        } else {
            // process all sites
            var query = {'site_url': {$ne: ''}};
            getSite(query, function(err, sites) {
                for (var s in sites) {
                    var site = sites[s];
                    var processed = 0;
                    parseSiteArticles(site, false, function() {
                        console.log('processing '+site.site_name);
                        processed++;
                        if (processed == sites.length) { 
                            process.exit(1);
                        }
                    });
                }
            });
        }
    
        getSite(query, function(err, site) {
            parseSiteArticles(site, function() {
                process.exit(1);
            });
        });
    });

// process command line args
program.parse(process.argv);

/**
 * Function
 * TODO: move these to modules
 */
function parseSiteArticles(site, save, callback) {
    getBandsIndex({'band_name': { $ne: '' } }, function(err, bands) {
        var bands = bands;
        getSiteArticles(site, function(err, site, articles) {
            for (var a in articles) {
                var article = articles[a];

                // look in pre-defined search fields
                for (var b in bands) {
                    var band = bands[b];
                    var match = articleHasMatch(site, article, band);
                    if (match) {
                        if (save) {
                            updateBandMention(band, site, article, function(err, band, site, article) {
                                console.log('saving ' + band.band_name + ' matched ' + article[site['link_field']]);
                            });
                        } else {
                            console.log(band.band_name + ' matched ' + article[site['link_field']]);
                        }
                    } else {
                        // no match for article            
                    }
                }
            }
            callback();
        });
    });
}

function articleHasMatch(site, article, band) {
    if (band.band_name) {
        var band_name = sanitizeSearchString(band.band_name);
        var search_fields = [ 
            'band_name_field',
            'artist_name_field', 
            'track_name_field', 
            'description_field' ];
        for (var f in search_fields) {
            var search_field = search_fields[f];
            if (article[site[search_field]]) {
                var search_text = sanitizeSearchString(article[site[search_field]].toString());
                var re = new RegExp('\\b' + band_name + '\\b', 'g');
                
                if (search_text.match(re)) {
                    return true;
                }
            }
        }

        return false;
    } else {
        console.log('could not parse article for band ' + band.band_name + '(' + band.band_id + ')');
        return false;
    }
}

function sanitizeSearchString(text) {
    sanitized_text = text.toLowerCase();
    sanitized_text = sanitized_text.replace('&', 'and')
        .replace(/[\+\,\.\?\!\-\;\:\'\(\)]+/g, '')
        .replace(/[\"“\'].+[\"”\']/g, '')
        .replace(/[\n\r]/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/[\\\/]/g, '');
 
    return sanitized_text;
}

function getSiteArticles(site, callback) {
    console.log('getting articles from ' + site.site_url);
    var options = {
        url: site.site_url,
    };
    request(options, function(err, response, body) {
        if (err) {
            // TODO:
            // something is wrong with this feed, report it
            console.log(err);
            callback(err);
        }

        if (typeof response === "undefined") {
            callback('no response');
            return false;
        }
        
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
                callback(null, site, articles);
            });
        } else {
            console.log('could not get ' + site.site_url + ', statusCode: '+response.statusCode);
            //process.exit(1);
        }
    }); 
}

function getSite(query, callback) {
    db.collection('sites').find(query).toArray(function(err, results) {
        if (err) throw err;

        if (results.length > 1) {
            callback('more than one site matched', results);
        } else {
            callback(null, results[0]);
        }
    });
}

function getBand(query, callback) {
    db.collection('bands').find(query).toArray(function(err, results) {
        if (err) throw err;
       
        if (results.length > 1) {
            callback('more than one band matched', results);
        } else { 
            callback(null, results[0]);
        }
    });
}

function getBandsIndex(query, callback) {
    db.collection('bands').find(query, {'band_name':1, 'band_id':1}).toArray(function(err, results) {
        if (err) {
            console.log(err);
            return false;
        }
       
        if (results.length > 0) {
            callback(null, results);
        } else {
            callback('no bands found', null);
        }
    });
}

function updateBandMention(band, site, article, callback) {
    var query = { 'band_id': band.band_id };
    var today = moment().format('YYYY-MM-DD');
    var description = article[site['description_field']];
    var link = article[site['link_field']];
    var set = { $addToSet: {"mentions": { "date": today, "link": link, "description": description } } };
   
    // add toays stat with upsert to overwrite in case it was already collected today
    db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
        callback(null, band, site, article);
    });
   
};

