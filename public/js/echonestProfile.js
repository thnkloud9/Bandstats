function EchonestProfile(model) {

    // adds json data from the api
    this.model = model;

    this.profileImages = [];
    this.profileBios = [];
    this.profileTags = [];
    this.profileStats = [];
    this.profileUrls = [];

    this.init();
}

EchonestProfile.prototype.setModel = function(model) {
   this.model = model; 
}

EchonestProfile.prototype.render = function(element, callback) {
    console.log('going to render echonestProfile to ' + element); 
    if (callback) {
        callback(this);
    }
}

EchonestProfile.prototype.init = function(callback) {
    // load everything
    this.name = this.model.name;
    this.id = this.model.mbid;
    this.url = this.model.url; 
    this.loadImages();
    this.loadBios();
    this.loadTags();
    this.loadStats();
    this.loadUrls();
            
    if (callback) {
        callback(this);
    }
}

EchonestProfile.prototype.loadUrls = function(callback) {
    if (this.model.urls) {
        for (var u in this.model.urls) {
            this.profileUrls.push(this.model.urls[u]);
        }
    }
}

EchonestProfile.prototype.loadTags = function(callback) {
    if (this.model.terms) {
        for (var t in this.model.terms) {
            var tag = this.model.terms[t];
            this.profileTags.push(tag.name);
        }
    }

    if (callback) {
        callback(this.profileTags);
    }
}

EchonestProfile.prototype.loadBios = function(callback) {
    if (this.model.biographies) {
        for (var b in this.model.biographies) {
            var bio = this.model.biographies[b];
            if (bio.text) {
                this.profileBios.push(bio.text);
            }
        }
    }

    if (callback) {
        callback(this.profileBios);
    }
}

EchonestProfile.prototype.loadStats = function(callback) {
    if (this.model.hotttnesss) {
        this.profileStats.push({
            "hotttnesss": this.model.hotttnesss
        });
    }
    if (this.model.familiarity) {
        this.profileStats.push({
            "familiarity": this.model.familiarity
        });
    }

    if (callback) {
        callback(this.profileStats);
    }
}

EchonestProfile.prototype.loadImages = function(callback) {
    if (this.model.images) {
        for (var i in this.model.images) {
            var image = this.model.images[i];

            if (image.url) {
                this.profileImages.push(image.url);
            }
        }
    }

    if (callback) {
        callback(this.profileImages);
    }
} 
