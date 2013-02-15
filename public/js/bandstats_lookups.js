/**
 * client side js to manage external api lookups
 */
var Lookup = function(provider, resource, service) {

    this.provider = provider;
    this.resource = resource;
    this.service = service;

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

    this.lookup = function(provider, resource, service, search) {
        this.setProvider(provider);
        this.setResource(resource);
        this.setService(service);

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
        var url = '/' + this.provider + '/' + this.resource + '/' + this.service;
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
        var displayElement = '#bs-lookup-matches-' + this.provider;
        var response = this.matches;
        var output = this.getCloseButton();

        output += "<div>";
        output += "<h4>Facebook Likes:</h4>";
        output += response;
        output += "</div>";

        $(displayElement).html(output);
        $(displayElement).show();
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

        console.log('could not find show function for ' + this.provider);
        return false;
    };

    this.getCloseButton = function() {
        return "<div class='bs-lookup-close'><a class='bs-lookup-matches-close' href='#'>close</a></div>";
    };

    this.showLastfmMatches = function(id) {
        var displayElement = '#bs-lookup-matches-' + this.provider;
        var response = this.matches;
        var output = this.getCloseButton();

        output += "<ul>";
        $(displayElement).empty();
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
                var bandId = '';
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-facebook-id='" + match.id + "' class='bs-lookup-match'>";
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
        $(displayElement).html(output);
        $(displayElement).show();
    };

    this.showFacebookMatches = function(id) {
        var displayElement = '#bs-lookup-matches-' + this.provider;
        var response = this.matches;
        var output = this.getCloseButton();

        output += "<ul>";
        $(displayElement).empty();
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
                var bandId = '';
            }

            output += "<li class='bs-lookup-match-group'>";
            output += "<strong>" + resultDisplay + "</strong>";
            output += "<ol>"
            
            for (var m in result.results) {
                var match = result.results[m];
                
                output += "<li data-band-id='" + bandId + "' data-facebook-id='" + match.id + "' class='bs-lookup-match'>";
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
        $(displayElement).html(output);
        $(displayElement).show();
    };

    this.saveMatch = function(type, match) {
        //TODO: add save function that works
        // with all lookup types
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

        externalLookup.lookup(provider, resource, service, search);

        //return false;
    });

    $('.bs-lookup-matches-close').live('click', function() {
        $(this).parent().parent('.bs-lookup-matches').hide();
    });

    $('.bs-lookup-match').live('click', function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
        } else {
            $(this).addClass('active');
        }
    });
});
