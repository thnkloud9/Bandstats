   
      
    /**
     * functions
     *
     * these should go somewhere at some point
     * maybe backbone makes sense
     */
    function showMainImage() {
        if (bandImages.length) {
            $('#bs-band-main-image').attr('src', bandImages[0]);    
            $('#bs-band-main-image').attr('data-image-index', 0);    
        }
    }

    function nextMainImage() {
        var currentImage = $('#bs-band-main-image').attr('data-image-index');
        var next = parseInt(currentImage) + 1;

        if (bandImages[next]) {
            $('#bs-band-main-image').attr('src', bandImages[next]);    
            $('#bs-band-main-image').attr('data-image-index', next);    
        } else {
            $('#bs-band-main-image').attr('src', bandImages[0]);    
            $('#bs-band-main-image').attr('data-image-index', 0);    
        }
    }

    function prevMainImage() {
        var currentImage = $('#bs-band-main-image').attr('data-image-index');
        var next = parseInt(currentImage) - 1;
        if (bandImages[next]) {
            $('#bs-band-main-image').attr('src', bandImages[next]);    
            $('#bs-band-main-image').attr('data-image-index', next);    
        } else {
            $('#bs-band-main-image').attr('src', bandImages[bandImages.length-1]);    
            $('#bs-band-main-image').attr('data-image-index', 0);    
        }
    }

    // update record
    function updateBand(band, callback) {
        var url = '';
        var type = '';
        var create = false;

        // update on server
        if (!band.band_id) {
            url = '/admin/band/create';
            type = 'post';
            create = true;
        } else {
            url = '/admin/band/' + band.band_id + '/update';
            type = 'put';
        }  
        $.ajax({
            url: url,
            type: type,
            data: {values: band},
            dataType: 'json',
            success: function(response) {
                console.log(response);
                if (response.band) {
                    band = response.band[0];
                }
                if (callback) {
                    callback(null, band);
                }
            },
            error: function(err, status, msg) {
                console.log(err);
                alertModal('Error updatng ' + band.band_name + ': ' + msg);
                callback(err, band);
            }
        });            
    }

    // delete record
    function deleteBand(band, callback) {
        if (!band.band_id) {
            return false;
        }

        $.ajax({
            url: '/admin/band/' + band.band_id + '/remove',
            type: 'delete',
            dataType: 'json',
            success: function(response) {
                console.log(response);
                callback(null, band);
            },
            error: function(err, status, msg) {
                console.log(err); 
                alertModal('Error deleteing ' + band.band_name + ': ' + msg);
                callback(err, band);
            }
        });

    }

    function showLastfmProfile(lastfmId) {
        $.ajax({
            url: '/admin/lastfm/' + encodeURIComponent(lastfmId) + '/info',
            type: 'get',
            dataType: 'json',
            success: function(response) {
                var output = "";
                if (response.image) {
                    for (var i in response.image) {
                        var image = response.image[i];
                        if ((image.size === 'extralarge') && (image['#text'])) {
                            output += "<img class='image-draggable lastfm-profile-img' src='" + image['#text'] + "'>";
                            bandImages.push(image['#text']);
                        }
                    }
                }
                output += "<div><h3>" + response.name + "</h3></div>";

                output += "<div class='clearright'>"; 
                if (response.url) {
                    output += "<p><strong>url:</strong> " + response.url + "</p>";
                }
                if (response.mbid) {
                    output += "<p><strong>mbid:</strong> " + response.mbid + "</p>";
                }
                if (response.tags) {
                    var tags = [];
                    for (var tl in response.tags) {
                        var taglist = response.tags[tl];
                        if (taglist.name) {
                            tags.push(taglist.name);
                            bandTerms.push(taglist.name);
                        } else {
                            for (var t in taglist) {
                                var tag = taglist[t];
                                if (tag.name) {
                                    tags.push(tag.name);
                                    bandTerms.push(tag.name);
                                }
                            }
                        }
                    }
                    
                    output += "<p><strong>tags:</strong> " + tags.join(', ') + "</p>";
                }
                if (response.bio) {
                    output += "<p><strong>bio:</strong> " + response.bio.summary + "</p>";
                }
                if (response.stats) {
                    output += "<p><strong>listeners:</strong> " + response.stats.listeners + "</p>";
                    output += "<p><strong>plays:</strong> " + response.stats.playcount + "</p>";
                }
                output += "</div>"; 
                $('#bs-lastfm-profile').html(output);
                $('#external-ids-lastfm-id').val(lastfmId);
                profiles.push('lastfm');

                // update main band image 
                showMainImage();
                
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        }) 
    }

    function showEchonestProfile(echonestId) {
        $.ajax({
            url: '/admin/echonest/' + encodeURIComponent(echonestId) + '/profile',
            type: 'get',
            dataType: 'json',
            success: function(response) {
                var output = "";
                if (response.images) {
                    var first = true;
                    for (var i in response.images) {
                        var image = response.images[i];
                        if (first && image.url) {
                            output += "<img class='image-draggable lastfm-profile-img' src='" + image.url + "'>";
                            first = false;
                        }
                        // add all images to the bands.images 
                        bandImages.push(image.url);
                    }
                }
                output += "<div><h3>" + response.name + "</h3></div>";

                output += "<div class='clearright'>"; 
                if (response.urls) {
                    for (var u in response.urls) { 
                        output += "<p><strong>url:</strong><a href='" + response.urls[u] + "'>" + u + "</a></p>";
                        bandUrls.push(response.urls[u]);
                    }
                }
                if (response.id) {
                    output += "<p><strong>id:</strong> " + response.id + "</p>";
                }
                if (response.terms) {
                    var terms = [];
                    for (var t in response.terms) {
                        var term = response.terms[t];
                        terms.push(term.name);
                        bandTerms.push(term.name);
                    }
                    
                    output += "<p><strong>terms:</strong> " + terms.join(', ') + "</p>";
                }
                if (response.biographies) {
                    // loop through bios
                    var first = true;
                    for (var b in response.biographies) {
                        var bio = response.biographies[b];
                        
                        if (first && bio.text) {
                            output += "<p><strong>bio:</strong> " + bio.text + "</p>";
                            first = false;
                        }
                        bandBios.push(bio);
                    }
                }

                output += "<p><strong>hotttnesss:</strong> " + response.hotttnesss + "</p>";
                output += "<p><strong>familiarity:</strong> " + response.familiarity + "</p>";
                output += "</div>"; 
                $('#bs-echonest-profile').html(output);
                profiles.push('echonest');
                $('#external-ids-echonest-id').val(echonestId);
               
                // update main band image 
                showMainImage();
                
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        });
    }

    function showSoundcloudProfile(soundcloudId) {
        $.ajax({
            url: '/admin/soundcloud/' + encodeURIComponent(soundcloudId) + '/profile',
            type: 'get',
            dataType: 'json',
            success: function(response) {
                var output = "";
                if (response.avatar_url) {
                    output += "<img class='image-draggable lastfm-profile-img' src='" + response.avatar_url + "'>";
                    bandImages.push(response.avatar_url);
                }
                output += "<div><h3>" + response.username + "</h3></div>";
                output += "<p><strong>" + response.full_name + "</strong></p>";

                output += "<div class='clearright'>"; 
                if (response.permalink_url) {
                    output += "<p><strong>url:</strong><a href='" + response.permalink_url + "'>" + response.permalink_url + "</a></p>";
                    bandUrls.push(response.uri);
                }
                if (response.id) {
                    output += "<p><strong>id:</strong> " + response.id + "</p>";
                }
                if (response.city) {
                    output += "<p>" + response.city;
                    if (response.country) {
                        output += ", " + response.country;
                    }
                    output += "</p>";
                }
                if (response.description) {
                    output += "<p><strong>bio:</strong> " + response.description + "</p>";
                    bandBios.push(response.description);
                }

                output += "<p><strong>followers:</strong> " + response.followers_count + "</p>";
                output += "</div>"; 
                $('#bs-soundcloud-profile').html(output);
                profiles.push('soundcloud');
                $('#external-ids-soundcloud-id').val(soundcloudId);
  
                // update main band image 
                showMainImage();
                
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        });
    }

    function showFacebookProfile(facebookId) {
        $.ajax({
            url: '/admin/facebook/' + facebookId + '/page',
            type: 'get', 
            dataType: 'json',
            success: function(response) {
                var output = "";
                if (response.cover) {
                    output += "<img class='image-draggable facebook-profile-img' src='" + response.cover.source + "'>";
                    bandImages.push(response.cover.source);
                }
           
                output += "<div><h3>" + response.name + "</h3></div>";

                output += "<div class='clearright'>"; 
                var displayFields = [ 
                    'about', 
                    'location', 
                    'current_location',
                    'hometown',
                    'genre',
                    'bio', 
                    'record_label', 
                    'website',
                    'link', 
                    'likes', 
                    'talking_about_count' ];

                for (var f in displayFields) {
                    var field = displayFields[f];
                    if (response[field]) {
                        output += "<p><strong>" + field + ":</strong> " + response[field] + "</p>";
                    }
                }
                output += "</div>"; 
                $('#bs-facebook-profile').html(output);
                profiles.push('facebook');
                $('#external-ids-facebook-id').val(facebookId);
 
                // update main band image 
                showMainImage();
            },
            error: function(err, status, msg) {
                console.log(err);
            }
        });
    }

    function showChart(id, dataset) {
        var data = []
        var options = {
            legend: { show: true },
            //points: { show: true },
            xaxis: {
                mode: "time",
                timeformat: "%m/%d"
            },
            yaxes: [ { }, { position: "right", min: 0 } ]
        };
        // format the data for the chart
        var data = []
        var incrData = []
        var previousValue = null;
        for (var p in dataset) {
            var point = dataset[p];
            var value = parseInt(point.value);
            if (!previousValue) {
                previousValue = value;
            } else {
                var incrValue = (value - previousValue); 
                // push incr
                incrData.push([new Date(point.date), incrValue]);
                previousValue = parseInt(point.value);
            }
            
            // push total
            data.push([new Date(point.date), value]);
        };
        $.plot($('#' + id), [
            {
                data: data,
                lines: { show: true },
                points: { show: true}
            }, 
            { 
                data: incrData,
                bars: { 
                    show: true, 
                    barWidth: 24*60*60*1000, 
                },
                yaxis: 2
            }
        ], options);
    };

$(document).ready(function(){

    /***************************
     * UI elements 
     */
    
    // regions
    $('.region-draggable').live('dragstart', function(e) {
        var regionName = $(this).attr('data-region-name');
        e.originalEvent.dataTransfer.setData('data-new-region-name', regionName);
    });

    // double click to remove
    $('.region-draggable').dblclick(function() {
        var bandId = $(this).attr('data-source-band-id');
        var parent = $(this).parent();

        $(this).remove();
        // update the band in the server
        var band = {
            "band_id": bandId,
            "regions": []
        } 
        parent.children('li').each(function() {
            band.regions.push($(this).attr('data-region-name'));
        });
        updateBand(band);
        return false;
    });

    $('.region-droppable').bind('dragover', function(e) {
        e.preventDefault();
        return false;
    });

    $('.region-droppable').live('drop', function(e) {
        e.preventDefault();
        var bandId = $(this).attr('data-band-id');
        var regionName = e.originalEvent.dataTransfer.getData('data-new-region-name');
        if (regionName) {
            var output = '<li draggable="true" class="region-draggable" data-region-name="' + regionName + '">' + regionName + '</li>';
            $(this).append(output);

            // update the band in the server
            var band = {
                "band_id": bandId,
                "regions": []
            } 
            $(this).children('li').each(function() {
                band.regions.push($(this).attr('data-region-name'));
            });
            updateBand(band);
        }
    });

    // genres
    $('.genre-draggable').live('dragstart', function(e) {
        var genreName = $(this).attr('data-genre-name');
        e.originalEvent.dataTransfer.setData('data-new-genre-name', genreName);
    });

    $('.genre-droppable').bind('dragover', function(e) {
        e.preventDefault();
        return false;
    });

    // double click to remove
    $('.genre-draggable').dblclick(function() {
        var bandId = $(this).attr('data-source-band-id');
        var parent = $(this).parent();

        $(this).remove();
        // update the band in the server
        var band = {
            "band_id": bandId,
            "genres": []
        } 
        parent.children('li').each(function() {
            band.genres.push($(this).attr('data-genre-name'));
        });
        updateBand(band);
        return false;
    });

    $('.genre-droppable').live('drop', function(e) {
        e.preventDefault();
        var bandId = $(this).attr('data-band-id');
        var genreName = e.originalEvent.dataTransfer.getData('data-new-genre-name');
        if (genreName) {
            var output = '<li draggable="true" class="genre-draggable" data-genre-name="' + genreName + '">' + genreName + '</li>';
            $(this).append(output);

            // update the band in the server
            var band = {
                "band_id": bandId,
                "genres": []
            } 
            $(this).children('li').each(function() {
                band.genres.push($(this).attr('data-genre-name'));
            });
            updateBand(band);
        }
    });

    $('.delete-band').live('click', function() {
        var parent = $(this);
        var bandId = $(this).attr('data-band-id');
        if (bandId) {
            deleteBand({"band_id": bandId}, function(err, band) {
                // remove from table
                var parentRow = parent.parent('td').parent('tr');
                if (parentRow) {
                    parentRow.remove();
                }

            });
        }
    });

});

