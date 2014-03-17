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
var util = require('util');

/**
 * Constructor
 *
 * accessToken is not required
 */
function FacebookManager(accessToken) {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.apiDomain = nconf.get('facebook:domain');
    this.appId = nconf.get('facebook:app_id');
    this.appSecret = nconf.get('facebook:app_secret');
    this.accessToken = this.appId + '|' + this.appSecret;
};

exports.getFacebookAccessToken = function(callback) {
    var parent = this;
    var api = this.apiDomain;
    var appId = this.appId;
    var appSecret = this.appSecret;
    var options = {
        url: api + '/oauth/access_token?grant_type=client_credentials&client_id=' + appId + '&client_secret=' + appSecret,
        json: true 
    }
    // authenticate this request to reduce likelyhood of 403s
    request(options, function (err, response, body) {
        var bodyParts = body.split("=");
        if (bodyParts[0] != "access_token") {
            callback('error, could not get facebook access token');
            return false;
        }
        var accessToken = bodyParts[1];
        parent.accessToken = accessToken;
        callback(err, accessToken);
    });
};

/**
 * search
 *
 * only returns music or artist pages
 * returns full page from graph api, not just serach
 * result
 */
FacebookManager.prototype.search = function(query, callback) {
    var parent = this;
    var api = this.apiDomain;
    var appId = this.appId;
    var appSecret = this.appSecret;
    var options = {
        url: api + '/oauth/access_token?grant_type=client_credentials&client_id=' + appId + '&client_secret=' + appSecret,
        json: true 
    }

    // authenticate this request to reduce likelyhood of 403s
    request(options, function (err, response, body) {
        var bodyParts = body.split("=");
        if (bodyParts[0] != "access_token") {
            callback('error, could not get facebook access token');
            return false;
        }
        var accessToken = bodyParts[1];
    

        var options = {
            url: api + '/search?q=' + query + '&type=page&access_token=' + accessToken,
            json: true            
        };

        util.log(options.url);

        request(options, function(err, response, body) {
            var musicPageIds = []; 
            var results = [];

            if (err || response.statusCode != 200) {
                callback("error, bad response from facebook, statusCode " + response.statusCode);
                return false;
            }
            if (!body.data) {
                callback("error, no results from faacebook");
                return false;
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
                util.log('requesting facebook page ' + musicPageId);
                var options = {
                    url: api + "/" + musicPageId + '?access_token=' + accessToken,
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
    });
}

/**
 * lookup
 * takes a searchObj with a search parameter and loops through
 * sending the search parameter to a function
 * searchObj should not exceed 600 elements
 * in order to stay within facebook api rate limit
 */
FacebookManager.prototype.lookup = function(searchObj, lookupFunction, callback) {
    var searchResults = [];
    var parent = this;
    var lookupFunction = eval('parent.'+lookupFunction);

    async.forEach(searchObj, function(searchItem, cb) {
        var bandId = searchItem.band_id;
        var bandName = searchItem.band_name;
        var searchTerm = searchItem.search;
        var previous = searchItem.previous;
        var totalStats = searchItem.total_stats;
        var incrementalTotal = searchItem.incremental_total;

        lookupFunction.call(parent, searchTerm, function(err, results) {
            if (err) {
                //just give err as result and move on
                results = err;
            };

            var searchResult = {
                "band_id": bandId,
                "band_name": bandName,
                "search": searchTerm,
                "results": results,
                "total_stats": totalStats,
                "incremental_total": incrementalTotal,
                "previous": previous
            };

            searchResults.push(searchResult); 
            
            cb(null, searchResults);
        });
    },
    function(err, results) {
        if (err) {
            callback(err, searchResults);
            return false;
        };
        util.log('facebook lookup done with all');
        callback(null, searchResults);
    });
};

FacebookManager.prototype.getPageImage = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=cover&access_token=' + this.accessToken,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body.cover) {
            callback("no results from facebook");
            return false;
        }

        callback(null, body.cover.source);
    });
}

FacebookManager.prototype.getPageTalkingAbout = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=talking_about_count&access_token=' + this.accessToken,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body.talking_about_count) {
            callback("error, no results from facebook");
            return false;
        }

        callback(null, body.talking_about_count);
    });
}

FacebookManager.prototype.getPageBio = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=bio&access_token=' + this.accessToken,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body.bio) {
            callback("error, no results from facebook");
            return false;
        }

        callback(null, body.bio);
    });
}


FacebookManager.prototype.getPageDescription = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=description&access_token=' + this.accessToken,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body.description) {
            callback("error, no results from facebook");
            return false;
        }

        callback(null, body.description);
    });
}

FacebookManager.prototype.getPage = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?access_token=' + this.accessToken,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body) {
            callback("error, no results from facebook");
            return false;
        }

        callback(null, body);
    });
}

FacebookManager.prototype.getPageLikes = function(facebookId, callback) {
    var options = { 
        url: this.apiDomain + '/' + facebookId + '?fields=likes&access_token=' + this.accessToken,
        json: true
    };

    util.log('requesting facebook likes for ' + facebookId);

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from facebook, statusCode " + response.statusCode);
            return false;
        }
        if (!body.likes) {
            callback("error, no results from facebook");
            return false;
        }
        if (body.likes.data) {
            callback("error, this is a old facebook page");
            return false;
        }

        callback(null, body.likes);
    });
}

/**
 * batch requires accessToken
 * batches can not have more than 50 requests at a time
 */
FacebookManager.prototype.getBatch = function(batch, callback) {
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
            callback('error, could not get facebook access token');
            return false;
        }
        var accessToken = bodyParts[1];
        var options = { 
            url: api + '?access_token=' + accessToken + '&batch=' + JSON.stringify(batch),
            method: 'POST',
            json: true
        };

        request(options, function (err, response, body) {
            if (err) {
                callback('error, bad response from facebook ' + err);
                return false;
            }

            callback(null, body);
        });
    });

}

module.exports = FacebookManager;
