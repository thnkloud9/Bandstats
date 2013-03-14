function Band(model) {

    // adds json data from the server
    this.model = model;
 
    this.bandImages = [];
    this.bandBios = [];
    this.bandTerms = [];
    this.bandReviews = [];
    this.bandEvents = [];
    this.bandUrls = [];
    this.bandBlogs = [];
    this.bandTracks = [];
    this.bandAlbums = [];
    this.bandLabels = [];
    this.bandProfiles = {};
} 

Band.prototype.setModel = function(model) {
   this.model = model; 
};

Band.prototype.render = function(template, container, callback) {
    var viewTemplate = $(template).html();
    $(container).html(_.template(viewTemplate, this.model)); 

    if (callback) {
        callback();
    } 
};

Band.prototype.showMainImage = function(element) {
    if (this.bandImages.length) {
        $(element).attr('src', this.bandImages[0]);    
        $(element).attr('data-image-index', 0);    
    }
};

Band.prototype.nextMainImage = function(element) {
    var currentImage = $(element).attr('data-image-index');
    var next = parseInt(currentImage) + 1;

    if (this.bandImages[next]) {
        $(element).attr('src', this.bandImages[next]);    
        $(element).attr('data-image-index', next);    
    } else {
        $(element).attr('src', this.bandImages[0]);    
        $(element).attr('data-image-index', 0);    
    }
};

Band.prototype.prevMainImage = function(element) {
    var currentImage = $(element).attr('data-image-index');
    var next = parseInt(currentImage) - 1;
    if (this.bandImages[next]) {
        $(element).attr('src', this.bandImages[next]);    
        $(element).attr('data-image-index', next);    
    } else {
        $(element).attr('src', bandImages[bandImages.length-1]);    
        $(element).attr('data-image-index', 0);    
    }
};

// update record
Band.prototype.updateBand = function(callback) {
    var parent = this;
    var url = '';
    var type = '';
    var create = false;

    // update on server
    if (!this.model.band_id) {
        url = '/admin/band/create';
        type = 'post';
        create = true;
    } else {
        url = '/admin/band/' + this.model.band_id + '/update';
        type = 'put';
    }  
    $.ajax({
        url: url,
        type: type,
        data: {values: this.model},
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
            alertModal('Error updatng ' + parent.model.band_name + ': ' + msg);
            callback(err, band);
        }
    });            
};

// delete record
Band.prototype.deleteBand = function(callback) {
    var parent = this;

    if (!this.model.band_id) {
        return false;
    }

    $.ajax({
        url: '/admin/band/' + this.model.band_id + '/remove',
        type: 'delete',
        dataType: 'json',
        success: function(response) {
            console.log(response);
            callback(null, band);
        },
        error: function(err, status, msg) {
            console.log(err); 
            alertModal('Error deleteing ' + parent.model.band_name + ': ' + msg);
            callback(err, band);
        }
    });

};

Band.prototype.loadLastfmProfile = function(callback) {
    var parent = this;
    var lastfmId = this.model.external_ids.lastfm_id || null;
    
    if (!lastfmId) {
        callback('lastfm_id does not exist for ' + this.model.band_id);
        return false;
    }

    $.ajax({
        url: '/admin/lastfm/' + encodeURIComponent(lastfmId) + '/info',
        type: 'get',
        dataType: 'json',
        success: function(response) {
            parent.bandProfiles.lastfm = new LastfmProfile(response);
            callback(null, parent.bandProfiles.lastfm);
        },
        error: function(err, status, msg) {
            console.log(err);
        }
    });
};

Band.prototype.loadEchonestProfile = function(callback) {
    var parent = this;
    var echonestId = this.model.external_ids.echonest_id || null;
    
    if (!echonestId) {
        callback('echonest_id does not exist for ' + this.model.band_id);
        return false;
    }

    $.ajax({
        url: '/admin/echonest/' + encodeURIComponent(echonestId) + '/profile',
        type: 'get',
        dataType: 'json',
        success: function(response) {
            parent.bandProfiles.echonest = new EchonestProfile(response);
            callback(null, parent.bandProfiles.echonest);
        },
        error: function(err, status, msg) {
            console.log(err);
        }
    });
};

Band.prototype.loadSoundcloudProfile = function(callback) {
    var parent = this;
    var soundcloudId = this.model.external_ids.soundcloud_id || null;
    
    if (!soundcloudId) {
        callback('soundcloud_id does not exist for ' + this.model.band_id);
        return false;
    }

    $.ajax({
        url: '/admin/soundcloud/' + encodeURIComponent(soundcloudId) + '/profile',
        type: 'get',
        dataType: 'json',
        success: function(response) {
            parent.bandProfiles.soundcloud = new SoundcloudProfile(response);
            callback(null, parent.bandProfiles.soundcloud);
        },
        error: function(err, status, msg) {
            console.log(err);
        }
    });
};

Band.prototype.loadFacebookProfile = function(callback) {
    var parent = this;
    var facebookId = this.model.external_ids.facebook_id || null;
    
    if (!facebookId) {
        callback('facebook_id does not exist for ' + this.model.band_id);
        return false;
    }

    $.ajax({
        url: '/admin/facebook/' + facebookId + '/page',
        type: 'get', 
        dataType: 'json',
        success: function(response) {
            parent.bandProfiles.facebook = new FacebookProfile(response);
            callback(null, parent.bandProfiles.facebook);
        },
        error: function(err, status, msg) {
            console.log(err);
        }
    });
};

Band.prototype.showChart = function(element, dataset) {
    var options = {
        legend: { show: true },
        xaxis: {
            mode: "time",
            timeformat: "%m/%d"
        },
        yaxes: [ { }, { position: "right", min: 0 } ]
    };
    var data = []
    var incrData = []
    var previousValue = null;

    // format the data
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

    // draw the chart
    $.plot($(element), [
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
