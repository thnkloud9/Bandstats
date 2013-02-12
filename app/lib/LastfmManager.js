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
            callback("bad response from lastfm");
            return false;
        }

        if (!body.results) {
            callback("no results from lastfm");
            return false;
        }

        if (!body.results.artistmatches) {
            callback("no results from lastfm");
            return false;
        }
       
        callback(null, body.results.artistmatches.artist);
    });  

};

LastfmManager.prototype.getListeners = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (!err && response.statusCode == 200) {

            if (body.artist) {
                callback(null, body.artist.stats.listeners);
            } else {
                callback('could not find listeners for '+lastfmId, null);
            }
        } else {
            callback(err);
        }
    });

}

module.exports = LastfmManager;
