function LastfmProfile(model) {

    // adds json data from the api
    this.model = model;

    this.profileImages = [];
    this.profileBios = [];
    this.profileTags = [];
    this.profileStats = [];
    this.profileSimilarArtists = [];
    
    this.init();
}

LastfmProfile.prototype.setModel = function(model) {
   this.model = model; 
}

LastfmProfile.prototype.render = function(element, callback) {
    console.log('going to render lastfmProfile to ' + element); 
    if (callback) {
        callback(this);
    }
}

LastfmProfile.prototype.init = function(callback) {
    // load everything
    this.name = this.model.name;
    this.id = this.model.mbid;
    this.url = this.model.url; 
    this.loadImages();
    this.loadBios();
    this.loadTags();
    this.loadStats();
    this.loadSimilarArtists();
            
    if (callback) {
        callback(this);
    }
}

LastfmProfile.prototype.loadSimilarArtists = function(callback) {
    if (this.model.similar && this.model.similar.artist) {
        for (var a in this.model.similar.artist) {
            var artist = this.model.similar.artist[a];
            this.profileSimilarArtists.push(artist.name);
        }
    }

    if (callback) {
        callback(this.profileSimilarArtists);
    }
}

LastfmProfile.prototype.loadTags = function(callback) {
    if (this.model.tags) {
        for (var tl in this.model.tags) {
            var taglist = this.model.tags[tl];
            if (taglist.name) {
                this.profileTags.push(taglist.name);
            } else {
                for (var t in taglist) {
                    var tag = taglist[t]
                    if (tag.name) {
                        this.profileTags.push(tag.name);
                    }
                }
            }
        }
    }

    if (callback) {
        callback(this.profileTags);
    }
}

LastfmProfile.prototype.loadBios = function(callback) {
    if (this.model.bio) {
        this.profileBios.push(this.model.bio.summary);
    }

    if (callback) {
        callback(this.profileBios);
    }
}

LastfmProfile.prototype.loadStats = function(callback) {
    if (this.model.stats) {
        if (this.model.stats.listeners) {
            this.profileStats.push({
                "listeners": this.model.stats.listeners
            });
        }
        if (this.model.stats.playcount) {
            this.profileStats.push({
                "playcount": this.model.stats.playcount
            });
        }
    }

    if (callback) {
        callback(this.profileStats);
    }
}

LastfmProfile.prototype.loadImages = function(callback) {
    if (this.model.image) {
        for (var i in this.model.image) {
            var image = this.model.image[i];

            if (image.size === 'extralarge' && image['#text']) {
                this.profileImages.push(image['#text']);
            }
        }
    }

    if (callback) {
        callback(this.profileImages);
    }
} 
