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

var db = require('mongoskin').db('localhost:27017', {
  database: 'bandstats',
  safe: true,
  strict: false,
});

var SiteRepository = require('./../app/repositories/SiteRepository.js');
var siteRepository = new SiteRepository({"db": db});
var BandRepository = require('./../app/repositories/BandRepository.js');
var bandRepository = new BandRepository({"db": db});

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
            siteRepository.find(query, {}, function(err, sites) {
                async.forEachSeries(sites, function(site, cb) {
                    parseSiteArticles(site, true, function(err) {
                        console.log('processing ' + site.site_name);
                        if (err) {
                            console.log(err);
                        } 
                        cb();
                    });
                },
                function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('done with all');
                    process.exit(1);
                }); 
            });
            return false;
        }
    
        siteRepository.findOne(query, function(err, site) {
            parseSiteArticles(site, true, function() {
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
            siteRepository.find(query, {}, function(err, sites) {
                async.forEachSeries(sites, function(site, cb) {
                    parseSiteArticles(site, false, function(err) {
                        console.log('processing ' + site.site_name);
                        if (err) {
                            console.log(err);
                        } 
                        cb();
                    });
                },
                function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('done with all');
                    process.exit(1);
                }); 
            });
            return false;
        }
    
        siteRepository.findOne(query, function(err, site) {
            parseSiteArticles(site, false, function(err, results) {
                if (err) {
                    console.log(err);
                }
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
    // get band list
    bandRepository.getBandsIndex({"band_name": { $ne: "" } }, function(err, bands) {
        // get new articles  
        siteRepository.getNewArticles(site, function(err, articles) {
            // loop through articles
            async.forEachSeries(articles, function(article, scb) {
                // loop through bands 
                async.forEachSeries(bands, function(band, cb) {
                    var match = articleHasMatch(site, article, band);

                    if (!match) {
                        cb();
                        return false;
                    }
                    
                    console.log('match ' + band.band_name + ' ' + article[site.link_field]);

                    if (save) {
                        bandRepository.updateMentions({ 'band_id': band.band_id }, site, article, function(err, results) {
                            cb(null, results);
                        });
                    } else { 
                        cb();
                    }

                },
                function(err, results) {
                    if (err) {
                        console.log(err);
                    }
                    scb();
                });
            },
            function(err, results) {
                if (err) {
                    console.log(err);
                }
                console.log('done with all');
                callback();
            });
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
        console.log(band);
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
