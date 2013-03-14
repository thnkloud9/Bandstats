function SoundcloudProfile(model) {

    // adds json data from the api
    this.model = model;

    this.profileImages = [];
    this.profileBios = [];
    this.profileTags = [];
    this.profileStats = [];
    this.profileSimilarArtists = [];

    this.init();
}

SoundcloudProfile.prototype.setModel = function(model) {
   this.model = model; 
}

SoundcloudProfile.prototype.render = function(element, callback) {
    console.log('going to render lastfmProfile to ' + element); 
    if (callback) {
        callback(this);
    }
}

SoundcloudProfile.prototype.init = function(callback) {
    // load everything
    this.name = this.model.name;
    this.id = this.model.mbid;
    this.url = this.model.url; 
    this.loadImages();
    this.loadBios();
    this.loadTags();
    this.loadStats();
            
    if (callback) {
        callback(this);
    }
}

SoundcloudProfile.prototype.loadTags = function(callback) {
    if (this.model.city) {
        this.profileTags.push(this.model.city);
    }
    if (this.model.country) {
        this.profileTags.push(this.model.country);
    }

    if (callback) {
        callback(this.profileTags);
    }
}

SoundcloudProfile.prototype.loadBios = function(callback) {
    if (this.model.description) {
        this.profileBios.push(this.model.description);
    }

    if (callback) {
        callback(this.profileBios);
    }
}

SoundcloudProfile.prototype.loadStats = function(callback) {
    if (this.model.followers) {
        this.profileStats.push({
           "followers": this.model.followers
        });
    }

    if (callback) {
        callback(this.profileStats);
    }
}

SoundcloudProfile.prototype.loadImages = function(callback) {
    if (this.model.avatar_url) {
        this.profileImages.push(this.model.avatar_url);
    }

    if (callback) {
        callback(this.profileImages);
    }
} 
