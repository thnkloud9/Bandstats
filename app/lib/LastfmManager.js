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

LastfmManager.prototype.getInfo = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('could not find info for ' + lastfmId);
            return false;
        }

        callback(null, body.artist);
    });

}

LastfmManager.prototype.getListeners = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('could not find listeners for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.stats.listeners);
    });

}

LastfmManager.prototype.getTopTags = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.toptags) {
            callback('could not find toptags for ' + lastfmId);
            return false;
        }

        callback(null, body.toptags);
    });
}

LastfmManager.prototype.getEvents = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getevents&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.events) {
            callback('could not find events for ' + lastfmId);
            return false;
        }

        callback(null, body.events);
    });
}

LastfmManager.prototype.getBio = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('could not find bio for ' + lastfmId);
            return false;
        }
        if (!body.artist.bio) {
            callback('could not find bio for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.bio.content);
    });
}

LastfmManager.prototype.getPlays = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if (!body.artist) {
            callback('could not find plays for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.stats.playcount);
    });

}

LastfmManager.prototype.getMbid = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if ((!body.artist) || (!body.artist.mbid)) {
            callback('could not find mbid for ' + lastfmId);
            return false;
        }

        callback(null, body.artist.mbid);
    });
}

LastfmManager.prototype.getImage = function(lastfmId, callback) {
    var options = { 
        url: 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + lastfmId + '&api_key=' + this.apiKey + '&format=json',
        json: true
    };

    request(options, function (err, response, body) {
        if (err && response.statusCode == 200) {
            callback('bad response from lastfm ' + err);
            return false;
        }
        if ((!body.artist) || (!body.artist.image)) {
            callback('could not find images for ' + lastfmId);
            return false;
        }

        var result = '';
        for (var i in body.artist.image) {
            var image = body.artist.image[i];
            if ((image['#text']) && (image.size === "medium")) {
                result = image['#text'];
            }
        }
        callback(null, result);
    });
}

module.exports = LastfmManager;
