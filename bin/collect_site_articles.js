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
var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
var util = require('util');
var JobRepository = require(path.join(__dirname, '/../app/repositories/JobRepository.js'));
var SiteRepository = require(path.join(__dirname,'/../app/repositories/SiteRepository.js'));
var BandRepository = require(path.join(__dirname,'/../app/repositories/BandRepository.js'));

/**
 * config, db, and app stuff
 */
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});

var jobRepository = new JobRepository({'db': db}); 
var siteRepository = new SiteRepository({"db": db});
var bandRepository = new BandRepository({"db": db});
var processStart = new Date().getTime();
var processed = 0;
/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-i, --site_id <site_id>', 'site id (numeric)')
    .option('-j, --job_id <job_id>', 'bandstats jobId Id (numeric), used for tracking only')
    .option('-n, --site_name <site_name>', 'site name')

/**
 * update commands
 */
program
    .command('update')
    .description('gets new articles from site, checks all bands for matches and saves matches in mongo')
    .action(function() {
        util.log('updating');
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
                        if (err) {
                            util.log(err);
                        } 
                        cb();
                    });
                },
                function(err) {
                    if (err) {
                        util.log(err);
                    }
                    var processEnd = new Date().getTime();
                    var duration = (processEnd - processStart);
                    if (program.job_id) {
                        var query = {"job_id": program.job_id};
                        var values = {
                            $set: {
                                "job_processed": processed,
                                "job_last_run": new Date(),
                                "job_duration": duration
                            }
                        }
                        jobRepository.update(query, values, function(err, result) {
                            util.log('done with all');
                            process.exit(1);
                        });
                    } else {
                        util.log('done with all');
                        process.exit(1);
                    }
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
                        util.log('processing ' + site.site_name);
                        if (err) {
                            util.log(err);
                        } 
                        cb();
                    });
                },
                function(err) {
                    if (err) {
                        util.log(err);
                    }
                    var processEnd = new Date().getTime();
                    var duration = (processEnd - processStart);
                    if (program.job_id) {
                        var query = {"job_id": program.job_id};
                        var values = {
                            $set: {
                                "job_processed": processed,
                                "job_last_run": new Date(),
                                "job_duration": duration
                            }
                        }
                        jobRepository.update(query, values, function(err, result) {
                            util.log('done with all');
                            process.exit(1);
                        });
                    } else {
                        util.log('done with all');
                        process.exit(1);
                    }
                }); 
            });
            return false;
        }
    
        siteRepository.findOne(query, function(err, site) {
            parseSiteArticles(site, false, function(err, results) {
                if (err) {
                    util.log(err);
                }
                var processEnd = new Date().getTime();
                var duration = (processEnd - processStart);
                if (program.job_id) {
                    var query = {"job_id": program.job_id};
                    var values = {
                        $set: {
                            "job_processed": processed,
                            "job_last_run": new Date(),
                            "job_duration": duration
                        }
                    }
                    jobRepository.update(query, values, function(err, result) {
                        util.log('done with all');
                        process.exit(1);
                    });
                } else {
                    util.log('done with all');
                    process.exit(1);
                }
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
    util.log("processing " + site.site_name);
    // get band list
    bandRepository.getBandsIndex({"band_name": { $ne: "" } }, function(err, bands) {
        // get new articles  
        siteRepository.getNewArticles(site, function(err, meta, articles) {
            if (err || !articles) {
                util.log('No articles found for ' + site.site_name);
                callback();
                return false;
            }
            // loop through articles
            async.forEachSeries(articles, function(article, scb) {
                processed++;
                // loop through bands 
                async.forEachSeries(bands, function(band, cb) {
                    var match = articleHasMatch(site, article, band);

                    if (!match) {
                        //cb();
                        setImmediate(function() { cb() }); 
                        return false;
                    }
                    
                    util.log('match ' + band.band_name + ' ' + article[site.link_field]);

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
                        util.log(err);
                    }
                    scb();
                });
            },
            function(err, results) {
                if (err) {
                    util.log(err);
                }
                if (save && meta) {
                    siteRepository.update({"site_id": site.site_id}, {$set: {"last_entry": meta.pubdate }}, function(err, results) {
                        util.log('done with ' + site.site_name);
                        callback();
                    });
                } else {
                    callback();
                }
            });
        });
    });
}

function articleHasMatch(site, article, band) {
    if (band.band_name) {
        var band_name = sanitizeSearchString(band.band_name);
        var search_fields = [ 
            'band_name_field',
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
        util.log('could not parse article for band ' + band.band_name + '(' + band.band_id + ')');
        util.log(band);
        return false;
    }
}

function sanitizeSearchString(text) {
    sanitized_text = text.toLowerCase();
    sanitized_text = sanitized_text.replace('&', 'and')
        .replace(/[\+\,\.\?\!\-\;\:\'\(\)\*]+/g, '')
        .replace(/[\"“\'].+[\"”\']/g, '')
        .replace(/[\n\r]/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/[\\\/]/g, '');
 
    return sanitized_text;
}
