/**
 * client side js to manage external api lookups
 */
var Lookup = function(provider, resource, service) {

    this.provider = provider;
    this.resource = resource;
    this.service = service;

    this.bandId = null; 

    this.search = [];
    this.matches = [];
    this.cache = {};

    this.setProvider = function(provider) {
        this.provider = provider;
    };

    this.setService = function(service) {
        this.service = service;
    };

    this.setResource = function(resource) {
        this.resource = resource;
    };

    this.lookup = function(provider, resource, service, search, bandId) {
        this.setProvider(provider);
        this.setResource(resource);
        this.setService(service);
        if (bandId) {
            this.bandId = bandId;
        }

        if (this.service === 'search') {
            this.getMatches(search);
        } else if (this.service === 'lookup') {
            this.getMatches(search);
        } else if (this.service === 'likes') {
            this.getLikes();
        } else {
            console.log(this.service + ' not found in bandstats_lookup.js');
        }
    };

    this._send = function(search, callback) {
        var parent = this;
        var url = '/admin/' + this.provider + '/' + this.resource + '/' + this.service;
        if (search) {
            url += '?search=' + search;
        };
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function(response) {
                parent.matches = response;
                callback(response);
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        });
    };
    
    this.getLikes = function() {
        var parent = this;

        this._send(null, function(response) {
            parent.showLikes();
        });
    };

    this.showLikes = function() {
        var displayElement = '#modal';
        var response = this.matches;

        $(displayElement).removeClass('loading');
        output = "<div>";
        output += "<h4>Facebook Likes:</h4>";
        output += response;
        output += "</div>";

        $(displayElement).append(output);
    }

    this.getMatches = function(search) {
        var parent = this;

        this._send(search, function(response) {
            parent.showMatches();
        });
    };

    this.showMatches = function() {
        if (this.provider === "facebook") {
            this.showFacebookMatches();
            return true;
        }
        if (this.provider === "lastfm") {
            this.showLastfmMatches();
            return true;
        }
        if (this.provider === "echonest") {
            this.showEchonestMatches();
            return true;
        }
        if (this.provider === "soundcloud") {
            this.showSoundcloudMatches();
            return true;
        }

        console.log('could not find show function for ' + this.provider);
        return false;
    };

    this.showSoundcloudMatches = function(id) {
        var displayElement = '#modal';
        var response = this.matches;
        var output = "<ul>";

        $(displayElement).removeClass('loading');
        for (var r in response) {
            var result = response[r];
            
            // skip if no matches
            if (!result.results.length) {
                continue;
            }

            if (result.band_name) {
                var resultDisplay = result.band_name;
            } else {
                var resultDisplay = result.search;
            }

            if (result.band_id) {
                var bandId = result.band_id;
            } else {
                if (this.bandId) {
                    var bandId = this.bandId;
                } else {
                    var bandId = '';
                }
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-provider='soundcloud' data-external-id='" + match.id + "' class='bs-lookup-match'>";
                var src = "";
                if (match.avatar_url) {
                    src = match.avatar_url;
                }
                output += "<img class='image-draggable' src='" + src + "'>";
                output += "<strong>" + match.username + "</strong> (" + match.id + ")";
                if (match.city) {
                    output += "<p>" + match.city;
                    if (match.country) {
                        output += ", " + match.country;
                    }
                    output += "</p>";
                }
                if (match.uri) {
                    output += "<p><a href='" + match.uri + "' target='_blank'>soundcloud page</a></p>";
                }
                if (match.website) {
                    output += "<p><a href='" + match.website + "' target='_blank'>" + match.website + "</a></p>";
                }
                if (match.description) {
                    output += "<p>" + match.description + "</p>";
                }
                if (match.followers_count) {
                    output += "<p><strong>followers:</strong>" + match.followers_count + "</p>";
                }
                output += "</li>";
            }
            output += "</ol>"
            output += "</li>";
        }
        output += "</ul>";
        $(displayElement).append(output);
    }

    this.showEchonestMatches = function(id) {
        var displayElement = '#modal';
        var response = this.matches;
        var output = "<ul>";

        $(displayElement).removeClass('loading');
        for (var r in response) {
            var result = response[r];
            
            // skip if no matches
            if (!result.results.length) {
                continue;
            }

            if (result.band_name) {
                var resultDisplay = result.band_name;
            } else {
                var resultDisplay = result.search;
            }

            if (result.band_id) {
                var bandId = result.band_id;
            } else {
                if (this.bandId) {
                    var bandId = this.bandId;
                } else {
                    var bandId = '';
                }
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-provider='echonest' data-external-id='" + match.id + "' class='bs-lookup-match'>";
                var src = "";
                output += "<img class='image-draggable' src='" + src + "'>";
                output += "<strong>" + match.name + "</strong> (" + match.id + ")";
                if (match.artist_location) {
                    output += "<p>";
                    if (match.artist_location.city) {
                        output += match.artist_location.city + ", ";
                    }
                    if (match.artist_location.country) {
                        output += match.artist_location.country;
                    }
                    output += "</p>";
                }
                if (match.urls) {
                    for (var u in match.urls) {
                        var url = match.urls[u];
                        output += "<p><a href='" + url + "' target='_blank'>" + u + "</a></p>";
                    }
                }
                output += "</li>";
            }
            output += "</ol>"
            output += "</li>";
        }
        output += "</ul>";
        $(displayElement).append(output);
    }

    this.showLastfmMatches = function(id) {
        var displayElement = '#modal';
        var response = this.matches;
        var output = "<ul>";

        $(displayElement).removeClass('loading');
        for (var r in response) {
            var result = response[r];
            
            // skip if no matches
            if (!result.results.length) {
                continue;
            }

            if (result.band_name) {
                var resultDisplay = result.band_name;
            } else {
                var resultDisplay = result.search;
            }

            if (result.band_id) {
                var bandId = result.band_id;
            } else {
                if (this.bandId) {
                    var bandId = this.bandId;
                } else {
                    var bandId = '';
                }
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-provider='lastfm' data-external-id='" + match.id + "' class='bs-lookup-match'>";
                var src = "";
                if (match.image) {
                    for (var i in match.image) {
                        var image = match.image[i];
                        if (image['#text'] && image.size === "medium") {
                            src = image['#text'];
                            break;
                        }
                    }
                }
                output += "<img class='image-draggable' src='" + src + "'>";
                output += "<strong>" + match.name + "</strong> (" + match.mbid + ")";
                output += "<p><strong>" + match.listeners + "</strong> listeners</p>";
                output += "</li>";
            }
            output += "</ol>"
            output += "</li>";
        }
        output += "</ul>";
        $(displayElement).append(output);
    };

    this.showFacebookMatches = function(id) {
        var displayElement = '#modal';
        var response = this.matches;
        var output = "<ul>";

        $(displayElement).removeClass('loading');
        for (var r in response) {
            var result = response[r];

            // skip if no matches
            if (!result.results.length) {
                continue;
            }

            if (result.band_name) {
                var resultDisplay = result.band_name;
            } else {
                var resultDisplay = result.search;
            }

            if (result.band_id) {
                var bandId = result.band_id;
            } else {
                if (this.bandId) {
                    var bandId = this.bandId;
                } else {
                    var bandId = '';
                }
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-provider='facebook' data-external-id='" + match.id + "' class='bs-lookup-match'>";
                var src = "";
                if (match.cover) {
                    src = match.cover.source;
                }
                output += "<img class='image-draggable' src='" + src + "'>";
                output += "<strong>" + match.name + "</strong> (" + match.id + ")";
                if (match.current_location) {
                    output += "<p>" + match.current_location + "</p>";
                }
                if (match.genre) {
                    output += "<p>" + match.genre + "</p>";
                }
                if (match.bio) {
                    output += "<p class='bs-bio-link'>bio</p>";
                    output += "<div class='bs-lookup-match-bio'>" + match.bio + "</div>";
                }
                output += "<p><strong>" + match.likes + "</strong> likes, ";
                output += "<strong>" + match.talking_about_count + "</strong> talking about</p>";
                output += "</li>";
            }
            output += "</ol>"
            output += "</li>";
        }
        output += "</ul>";
        $(displayElement).append(output);
    };

    this.saveMatch = function(provider, bandId, externalId) {
        //TODO: add save function that works
        // with all lookup types
        var set = {};
        set['external_ids.' + provider + '_id'] = externalId;

        url = '/band/' + bandId + '/update';
        type = 'put';

        $.ajax({
            url: url,
            type: type,
            data: {values: set},
            dataType: 'json',
            success: function(response) {
                console.log(response);
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        });            
        
    };
};

var externalLookup = new Lookup(); 

$(function() {

    /* event handlers */

    $('.bs-lookup').live('click', function() {
        var provider = $(this).attr('data-provider');
        var resource = $(this).attr('data-resource');
        var service = $(this).attr('data-service');
        var search = $(this).attr('data-search');
        var bandId = $(this).attr('data-band-id');

        externalLookup.lookup(provider, resource, service, search, bandId);
        //return false;
    });

    $('.bs-lookup-matches-close').live('click', function() {
        $(this).parent().parent('.bs-lookup-matches').hide();
    });

    $('.bs-lookup-match').live('click', function() {
        var bandId = $(this).attr('data-band-id');
        var provider = $(this).attr('data-provider');
        var externalId = $(this).attr('data-external-id');

        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            // show all other matches for this band
            $('.bs-lookup-match').each(function() {
                if ($(this).attr('data-band-id') === bandId) {
                    $(this).removeClass('hidden');
                    $(this).show();
                };
            });

            // remove save button
            $(this).find('.bs-match-save').remove();
        } else {
            $(this).addClass('active');
            // hide all other matches for this band
            $('.bs-lookup-match').each(function() {
                if ($(this).attr('data-band-id') === bandId) {
                    if (!$(this).hasClass('active')) {
                        $(this).addClass('hidden');
                        $(this).hide();
                    }
                };
            });
            
            // add save button
            $(this).append("<button data-band-id='" + bandId + "' data-provider='" + provider + "' data-external-id='" + externalId + "' class='bs-match-save'>Save</button>");
        }
    });

    $('.bs-match-save').live('click', function() {
        var bandId = $(this).attr('data-band-id');
        var provider = $(this).attr('data-provider');
        var externalId = $(this).attr('data-external-id');

        externalLookup.saveMatch(provider, bandId, externalId);
        // remove this from the lookup list
        $(this).parent().parent().parent().hide();
    });
});
