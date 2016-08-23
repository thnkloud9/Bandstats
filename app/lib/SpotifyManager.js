/**
 * Spotify Manager
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
var sleep = require('sleep');

/**
 * Constructor
 */
function SpotifyManager() {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.clientId = nconf.get('spotify:client_id');
    this.clientSecret = nconf.get('spotify:client_secret');
    this.apiDomain = nconf.get('spotify:domain');
    this.accessToken = null;
    this.tokenType = null;
    this.tokenExpire = null;
}

SpotifyManager.prototype.getSpotifyAccessToken = function(callback) {
    var now = new Date();
    var expire = new Date();
    // return token if its valid
    if ((typeof this.accessToken !== 'undefined') && (now.getTime() < this.tokenExpire)) {
      util.log('I have a valid token already');
      var accessToken = this.tokenType + ' ' + this.accessToken;
      callback(null, accessToken);
    }

    util.log('requesting new access token');
    var parent = this;
    var api = "https://accounts.spotify.com/api/token";
    var clientId = this.clientId;
    var clientSecret = this.clientSecret;
    var base64Code = new Buffer(clientId+':'+clientSecret).toString('base64');
    var encodedAuth = 'Basic '+base64Code;
    var options = {
        uri: api,
        form: {
            'grant_type': 'client_credentials'
        },
        headers: {
            'Authorization': encodedAuth
        }
    }

    // authenticate this request to reduce likelyhood of 403s
    request.post(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            util.log('BAD RESPONSE FROM ACCESS TOKEN REQUEST. CODE: '+response.statusCode);
            callback('error, could not get spotify access token');
            return false;
        }

        var jsonBody = JSON.parse(body);
        parent.accessToken = jsonBody.access_token;
        parent.tokenType = jsonBody.token_type;
        expire.setTime(expire.getTime()+(jsonBody.expires_in));
        parent.tokenExpire = expire.getTime();
        var accessToken = 'Bearer ' + jsonBody.access_token;

        callback(err, accessToken);
    });
}

SpotifyManager.prototype.search = function(query, callback) {
    var options = {
        url: this.apiDomain + 'search?q=' + query + '&client_id=' + this.clientId + '&type=artist',
        json: true            
    }
    util.log(options.url),

    request(options, function(err, response, body) {
        if (err || response.statusCode != 200) {
            callback("error, bad response from spotify");
            return false;
        }

        if (body.artists.items) {
            results = body.artists.items;
        } 
        callback(null, results);
    });  

};

/**
 * lookup
 * takes a searchObj with a search parameter and loops through
 * sending the search parameter to a function
 * searchObj should not exceed 600 elements
 * in order to stay within facebook api rate limit
 */
SpotifyManager.prototype.lookup = function(searchObj, lookupFunction, callback) {
    var searchResults = [];
    var parent = this;
    var lookupFunction = eval('this.'+lookupFunction);

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
                "previous": previous,
                "total_stats": totalStats,
                "incremental_total": incrementalTotal
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
        util.log('spotify lookup done with all');
        callback(null, searchResults);
    });
};

SpotifyManager.prototype.getInfo = function(spotifyId, callback) {
    var options = { 
        url: this.apiDomain + 'artists/' + spotifyId + '?client_id=' + this.clientId,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from spotify ' + err);
            return false;
        }

        callback(null, body);
    });

}

SpotifyManager.prototype.getFollowers = function(spotifyId, callback) {
    var parent = this;
    this.getSpotifyAccessToken(function(err, accessToken) {
        if (err) {
            callback(err);
            return false;
        }
        var options = { 
            url: parent.apiDomain + 'artists/' + spotifyId + '?client_id=' + parent.clientId,
            headers: {
                'Authorization': accessToken
            },
            json: true
        };

        request(options, function (err, response, body) {
            if (err || response.statusCode != 200) {
                callback('error, bad response from spotify ' + err);
                return false;
            }
            if (typeof body.followers === 'undefined') {
                callback('error, could not find followers for ' + spotifyId);
                return false;
            }

            callback(null, parseInt(body.followers.total));
        });
    });
}

SpotifyManager.prototype.getPopularity = function(spotifyId, callback) {
    var options = { 
        url: this.apiDomain + 'artists/' + spotifyId + '?client_id=' + this.clientId,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from spotify ' + err);
            return false;
        }
        if (!body.popularity) {
            callback('error, could not find popularity for ' + spotifyId);
            return false;
        }

        callback(null, parseInt(body.popularity));
    });

}


SpotifyManager.prototype.getImage = function(spotifyId, callback) {
    var options = { 
        url: this.apiDomain + 'artists/' + spotifyId + '?client_id=' + this.clientId,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from spotify ' + err);
            return false;
        }

        if ((!body.artist) || (!body.artist.image)) {
            callback('error, could not find images for ' + spotifyId);
            return false;
        }

        var result = '';
        for (var i in body.images) {
            var image = body.artist.image[i];
            if (image.height === 300)  {
                result = image.url;
            }
        }
        callback(null, result);
    });
}

module.exports = SpotifyManager;
