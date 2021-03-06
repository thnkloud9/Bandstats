/**
 * Lastfm Manager
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
function LastfmManager() {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.apiKey = nconf.get('lastfm:api_key');
    this.apiDomain = nconf.get('lastfm:domain');
}

LastfmManager.prototype.search = function(query, callback) {
    var options = {
        url: this.apiDomain + '/?method=artist.search&artist=' + query + '&api_key=' + this.apiKey + '&format=json',
        json: true            
    }
    request(options, function(err, response, body) {
        var results = [];

        if (err || response.statusCode != 200) {
            callback("error, bad response from lastfm");
            return false;
        }

        if (!body.results) {
            callback("error, no results from lastfm");
            return false;
        }

        if (!body.results.artistmatches) {
            callback("error, no results from lastfm");
            return false;
        }
      
        if (body.results.artistmatches.artist) {
            results = body.results.artistmatches.artist;
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
LastfmManager.prototype.lookup = function(searchObj, lookupFunction, callback) {
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
        util.log('lastfm lookup done with all');
        callback(null, searchResults);
    });
};

LastfmManager.prototype.getInfo = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('error, could not find info for ' + lastfmId);
            return false;
        }

        callback(null, body.artist);
    });

}

LastfmManager.prototype.getListeners = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('error, could not find listeners for ' + lastfmId);
            return false;
        }

        callback(null, parseInt(body.artist.stats.listeners));
    });

}

LastfmManager.prototype.getTopTags = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.gettoptags&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.toptags) {
            callback('error, could not find toptags for ' + lastfmId);
            return false;
        }

        callback(null, body.toptags);
    });
}

LastfmManager.prototype.getEvents = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getevents&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.events) {
            callback('error, could not find events for ' + lastfmId);
            return false;
        }

        callback(null, body.events);
    });
}

LastfmManager.prototype.getBio = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('error, could not find bio for ' + lastfmId);
            return false;
        }
        if (!body.artist.bio) {
            callback('error, could not find bio for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.bio.content);
    });
}

LastfmManager.prototype.getPlays = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('error, could not find plays for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.stats.playcount);
    });

}

LastfmManager.prototype.getMbid = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }
        if ((!body.artist) || (!body.artist.mbid)) {
            callback('error, could not find mbid for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.mbid);
    });
}

LastfmManager.prototype.getImage = function(lastfmId, callback) {
    var options = { 
        url: this.apiDomain + '/?method=artist.getinfo&artist=' + encodeURIComponent(lastfmId) + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from lastfm ' + err);
            return false;
        }

        if ((!body.artist) || (!body.artist.image)) {
            callback('error, could not find images for ' + lastfmId);
            return false;
        }

        var result = '';
        for (var i in body.artist.image) {
            var image = body.artist.image[i];
            if ((image['#text']) && (image.size === "large")) {
                result = image['#text'];
            }
        }
        callback(null, result);
    });
}

module.exports = LastfmManager;
