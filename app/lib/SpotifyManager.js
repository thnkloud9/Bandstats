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

/**
 * Constructor
 */
function SpotifyManager() {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.clientId = nconf.get('spotify:client_id');
    this.apiDomain = nconf.get('spotify:domain');
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
        url: this.apiDomain + 'artists/' + spotifyId + '&client_id=' + this.clientId,
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
    var options = { 
        url: this.apiDomain + 'artists/' + spotifyId + '?client_id=' + this.clientId,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from spotify ' + err);
            return false;
        }
        if (!body.followers.total) {
            callback('error, could not find followers for ' + spotifyId);
            return false;
        }

        callback(null, parseInt(body.followers.total));
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
