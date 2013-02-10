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
var path = require('path');
var nconf = require('nconf');
nconf.file(path.join(__dirname, '/../app/config/app.json'));
var db = require('mongoskin').db(nconf.get('db:host'), {
    port: nconf.get('db:port'),
    database: nconf.get('db:database'),
    safe: true,
    strict: false
});

/**
 * command parameters
 */
program
    .version('0.0.1')
    .option('-f, --facebook_id <facebook_id>', 'Facebook Id')
    .option('-i, --band_id <band_id>', 'bandstats bandId Id (numeric)')
    .option('-n, --band_name <band_name>', 'band name')
    .option('-f, --field <field_name>', 'Facebook Graph Field Id (example: likes, dscription, talking_about_count')

/**
 * update commands
 */
program
    .command('update')
    .description('gets new likes from facebook graph api and saves the value in mongo')
    .action(function() {
        var all_start = new Date().getTime();

        if (program.facebook_id) {
            var query = { 'running_stats.facebook_likes.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } 

        if (query) {
            getBand(query, function(err, results) {
                if (err) throw err;

                if (results.band_id) {
                    var band_id = results.band_id
                    var facebookId = results.running_stats.facebook_likes.facebook_id
                    getFacebookLikes(facebookId, function (err, likes) {
                        updateBandFacebookLikes({"band_id": band_id}, likes, function(err, results) {
                            console.log('updated band_id ' + band_id + ' with ' + likes + ' likes');
                            process.exit(1);
                        });
                    });
                }
            });
        } else {
            getAllFacebookLikes(function(err, processed) {
                var all_end  = new Date().getTime();
                console.log('getAllFacebookLikes took ' + (all_end - all_start) + ' milliseconds');
                process.exit(1);
            });
        }
    });

/**
 * view commands
 */
program
    .command('view')
    .description('gets new likes from facebook graph api display, but does not save the value in mongo')
    .action(function() {
        if (program.facebook_id) {
            var query = { 'running_stats.facebook_likes.facebook_id': program.facebook_id };
        } else if (program.band_id) {
            var query = { 'band_id': program.band_id };
        } else if (program.band_name) {
            var query = { 'band_name': program.band_name };
        } else {
            console.log('you must use either lastfm_id, band_id, or band_name with view command');
            process.exit(1);
        }
        getBand(query, function(err, results) {
            if (err) throw err;

            if (results.band_id) {
                var band_id = results.band_id
                var facebookId = results.running_stats.facebook_likes.facebook_id

                getFacebookLikes(facebookId, function (err, likes) {
                    console.log('band_id ' + band_id + ' facebook_id ' + facebookId + ' likes ' + likes);
                    process.exit(1);
                });
            }
        });
    });

// process command line args
program.parse(process.argv);

/**
 * Function
 * TODO: move these to modules
 */
function getAllFacebookLikes(callback) {
    var query = {
        $and: [
            {"running_stats.facebook_likes.facebook_id": { $ne: "" }},
            {"running_stats.facebook_likes.facebook_id": { $ne: null }},
            {"band_id": { $ne: "" }}, 
        ]
    };
    var fields = { 
        "_id":0, 
        "band_id":1, 
        "band_name":1, 
        "running_stats.facebook_likes.facebook_id":1 
    };

    db.collection('bands').find(query, fields).toArray(function(err, results) {
        if (err) throw err;

        var processed = 0;
        var start = new Date().getTime(); 

        // make facebook graph api batches to avoid rate limit (600 request in 600 seconds)
        var batches = [];
        var requests = [];
        var count = 0;
        for (var r in results) {
            count++;
            var result = results[r];
            var request = {
                "method": "GET",
                "relative_url": result.running_stats.facebook_likes.facebook_id + "?fields=likes"
            };
            if (count < 50) {
                requests.push(request);
            } else {
                requests.push(request);
                batches.push(requests);
                requests = [];
                count = 0;
            } 
        }

        async.forEachSeries(batches, function(batch, scb) {
            // get likes 50 at a time
            getFacebookLikesBatch(batch, function(err, results) {
                // update likes one at a time
                async.forEach(results, function(result, cb) {
                    if (!result) {
                        cb('no result, wtf');
                        return false;
                    }
                    var body = JSON.parse(result.body);
                    var facebookId = body.id;
                    var query = {"running_stats.facebook_likes.facebook_id": facebookId};
                    var likes = body.likes;
                    if (!facebookId) {
                        cb('no facebook id');
                        return false;
                    } 
                    updateBandFacebookLikes(query, likes, function(err, results) {
                        processed++;
                        console.log(facebookId + ' updated with ' + likes + ' likes');
                        cb(err, facebookId, likes);
                    });

                },
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                    scb();
                });
            });
        },
        function(err) {
            if (err) {
                console.log(err);
            }
            console.log('done with all batches');
            callback();
        });
    });
};

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

function getFacebookLikes(facebookId, callback) {
    var options = { 
        url: 'http://graph.facebook.com/' + facebookId + '?fields=likes',
        json: true
    };

    request(options, function (err, response, body) {
        console.log(body);
        if (!err && response.statusCode == 200) {
            
            if (body.likes) {
                callback(null, body.likes);
            } else {
                callback('could not find likes for facebookId ' + facebookId, null);
            }
        } else {
            callback(err);
        }
    });

};

function getFacebookLikesBatch(batch, callback) {
    var api = 'https://graph.facebook.com';
    var appId = nconf.get('facebook:app_id');
    var appSecret = nconf.get('facebook:app_secret');
    var options = {
        url: api + '/oauth/access_token?grant_type=client_credentials&client_id=' + appId + '&client_secret=' + appSecret,
        json: true 
    }
    // facebook requires access token for batch requests
    // so we gotta get that first
    request(options, function (err, response, body) {
        var bodyParts = body.split("=");
        if (bodyParts[0] != "access_token") {
            callback('could not get facebook access token');
            return false;
        }
        var accessToken = bodyParts[1];
        var options = { 
            url: api + '?access_token=' + accessToken + '&batch=' + JSON.stringify(batch),
            method: 'POST',
            json: true
        };

        request(options, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                callback(null, body);
            } else {
                callback(err);
            }
        });
    });
};

function updateBandFacebookLikes(query, likes, callback) {
    // add toays stat with upsert to overwrite in case it was already collected today
    async.series({
        deleteToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  today } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
        updateToday: function(cb) {
            var today = moment().format('YYYY-MM-DD');
            var set = { $addToSet: {"running_stats.facebook_likes.daily_stats": { "date": today, "value": likes } } };
            db.collection('bands').update(query, set, {upsert:true}, function(err, result) {
                cb(err, result);
            });
        },
        deleteOld: function(cb) {
            var expire = moment().subtract('months', 6).calendar();
            var set = { $pull: {"running_stats.facebook_likes.daily_stats": { "date":  expire } } };
            db.collection('bands').update(query, set, function(err, result) {
                cb(err, result);
            });
        },
    },
    function(err, results) {
        callback(err, results);
    });
   
};

