/**
 * Echonest Manager
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
function EchonestManager() {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.apiKey = nconf.get('echonest:api_key');
    this.apiDomain = nconf.get('echonest:domain');
}

EchonestManager.prototype.search = function(query, callback) {
    var options = {
        url: this.apiDomain + '/artist/search?name=' + query + '&api_key=' + this.apiKey + '&format=json&bucket=artist_location&bucket=urls&bucket=years_active',
        json: true            
    }
    request(options, function(err, response, body) {
        var results = [];

        if (err || response.statusCode != 200) {
            callback("error, bad response from echonest");
            return false;
        }

        if (!body.response) {
            callback("error, no results from echonest");
            return false;
        }

        if (!body.response.artists) {
            callback("error, no results from echonest");
            return false;
        }
       
        callback(null, body.response.artists);
    });  

};

/**
 * lookup
 * takes a searchObj with a search parameter and loops through
 * sending the search parameter to a function
 * searchObj should not exceed 600 elements
 * in order to stay within echonest api rate limit
 */
EchonestManager.prototype.lookup = function(searchObj, lookupFunction, callback) {
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

        // sleep 0.5 seconds to avoid rate limit
        util.log('Looking up ' + bandName + ' using ' + searchTerm);
        sleep.usleep(500000);

        lookupFunction.call(parent, searchTerm, function(err, results) {
            if (err) {
                //just give err as result and move on
                util.log(err);
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
        util.log('echonest lookup done with all');
        callback(null, searchResults);
    });
};

EchonestManager.prototype.getProfile = function(echonestId, callback) {
    var buckets = [ 'biographies', 'blogs', 'familiarity', 'hotttnesss', 'images', 'artist_location', 'news', 'reviews', 'terms', 'urls', 'years_active'];
    var url =  this.apiDomain +'/artist/profile?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json';
    for (var b in buckets) {
        url += '&bucket=' + buckets[b];
    }

    var options = { 
        url:  url,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }
        if (!body.response.artist) {
            callback('error, could not find info for ' + echonestId);
            return false;
        }

        callback(null, body.response.artist);
    });

}

EchonestManager.prototype.getHotttnesss = function(echonestId, callback) {
    var options = { 
        url: this.apiDomain + '/artist/hotttnesss?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }
        if (!body.response.artist) {
            callback('error, could not find listeners for ' + echonestId);
            return false;
        }

        callback(null, body.response.artist);
    });

}

EchonestManager.prototype.getTerms = function(echonestId, callback) {
    var options = { 
        url: this.apiDomain + '/artist/terms?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }
        if (!body.response.terms) {
            callback('error, could not find toptags for ' + echonestId);
            return false;
        }

        callback(null, body.response.artist);
    });
}

EchonestManager.prototype.getBiographies = function(echonestId, callback) {
    var options = { 
        url: this.apiDomain + '/artist/biographies?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }

        if (!body.response) {
            callback('error, could not find biographies for ' + echonestId);
            return false;
        }

        if (!body.response.biographies) {
            callback('error, could not find biographies for ' + echonestId);
            return false;
        }

        callback(null, body.response.biographies);
    });
}

EchonestManager.prototype.getImages = function(echonestId, callback) {
    var options = { 
        url: this.apiDomain +'/artist/images?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }
        if ((!body.response) || (!body.response.images)) {
            callback('error, could not find images for ' + echonestId);
            return false;
        }

        callback(null, body.response.images);
    });
}

EchonestManager.prototype.getSongs = function(echonestId, callback) {
    var options = { 
        url: this.apiDomain +'/artist/songs?id=' + echonestId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from echonest ' + err);
            return false;
        }
        if ((!body.response) || (!body.response.songs)) {
            callback('error, could not find songs for ' + echonestId);
            return false;
        }

        callback(null, body.response.songs);
    });
}

module.exports = EchonestManager;
