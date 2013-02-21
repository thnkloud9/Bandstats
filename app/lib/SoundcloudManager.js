/**
 * Soundcloud Manager
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
function SoundcloudManager() {
    nconf.file(path.join(__dirname, '../config/app.json'));
    this.clientId = nconf.get('soundcloud:client_id');
    this.apiDomain = nconf.get('soundcloud:domain');
}

SoundcloudManager.prototype.search = function(query, callback) {
    var options = {
        url: this.apiDomain + '/users.json?q=' + query + '&client_id=' + this.clientId,
        json: true            
    }
    request(options, function(err, response, body) {
        var results = [];

        if (err || response.statusCode != 200) {
            callback("error, bad response from soundcloud");
            return false;
        }

        if (!body) {
            callback("error, no results from soundcloud");
            return false;
        }
       
        callback(null, body);
    });  

};

/**
 * lookup
 * takes a searchObj with a search parameter and loops through
 * sending the search parameter to a function
 * searchObj should not exceed 600 elements
 * in order to stay within soundcloud api rate limit
 */
SoundcloudManager.prototype.lookup = function(searchObj, lookupFunction, callback) {
    var searchResults = [];
    var parent = this;
    var lookupFunction = eval('parent.'+lookupFunction);

    async.forEach(searchObj, function(searchItem, cb) {
        var bandId = searchItem.band_id;
        var bandName = searchItem.band_name;
        var searchTerm = searchItem.search;

        lookupFunction.call(parent, searchTerm, function(err, results) {
            if (err) {
                //just give err as result and move on
                results = err;
            };

            var searchResult = {
                "band_id": bandId,
                "band_name": bandName,
                "search": searchTerm,
                "results": results
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
        util.log('soundcloud lookup done with all');
        callback(null, searchResults);
    });
};

SoundcloudManager.prototype.getProfile = function(soundcloudId, callback) {
    var url =  this.apiDomain + '/users/' + soundcloudId + '.json?client_id=' + this.clientId;
    var options = { 
        url:  url,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from soundcloud ' + err + ', ' + response.statusCode + ' ' + url);
            return false;
        }
        if (!body.id) {
            callback('error, could not find info for ' + soundcloudId);
            return false;
        }

        callback(null, body);
    });

}

SoundcloudManager.prototype.getTracks = function(soundcloudId, callback) {
    var options = { 
        url: this.apiDomain + '/users/' + soundcloudId + '/tracks.json?client_id=' + this.clientId,
        json: true
    };

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            callback('error, bad response from soundcloud ' + err);
            return false;
        }
        if (!body) {
            callback('error, could not find tracks for ' + soundcloudId);
            return false;
        }

        callback(null, body);
    });

}

module.exports = SoundcloudManager;
