/**
 * Facebook Manager
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

/**
 * Constructor
 *
 * accessToken is not required
 */
function FacebookManager(accessToken) {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.accessToken = accessToken;
    this.apiDomain = nconf.get('facebook:domain');
    this.appId = nconf.get('facebook:app_id');
    this.appSecret = nconf.get('facebook:app_secret');
};

/**
 * search
 *
 * only returns music or artist pages
 * returns full page from graph api, not just serach
 * result
 */
FacebookManager.prototype.search = function(query, callback) {
    var api = this.apiDomain;
    var options = {
        url: api + '/search?q=' + query + '&type=page',
        json: true            
    };

    request(options, function(err, response, body) {
        var musicPageIds = []; 
        var results = [];

        if (err || response.statusCode != 200) {
            callback("bad response from facebook");
        }
        if (!body.data) {
            callback("no results from faacebook");
        }
       
        for (var p in body.data) {
            var facebookId = body.data[p].id;
            if ((body.data[p].category === "Musician/band") ||
                (body.data[p].category === "Artist")) {
                musicPageIds.push(facebookId);
            }
        }
       
        // now lets get the details for each music page 
        async.forEach(musicPageIds, function(musicPageId, cb) {
            console.log('requesting facebook page ' + musicPageId);
            var options = {
                url: api + "/" + musicPageId,
                json: true
            }; 
            request(options, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    results.push(body);
                    cb();
                }
            });
        },
        function(err) {
             callback(null, results);
        });
    });
}

FacebookManager.prototype.getPageLikes = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=likes',
        json: true
    };

    request(options, function (err, response, body) {
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
}

/**
 * batch requires accessToken
 * batches can not have more than 50 requests at a time
 */
FacebookManager.prototype.getPageLikesBatch = function(batch, callback) {
    var api = this.apiDomain;
    var appId = this.appId;
    var appSecret = this.appSecret;
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

}

module.exports = FacebookManager;
