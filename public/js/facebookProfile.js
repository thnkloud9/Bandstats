function FacebookProfile(model) {

    // adds json data from the api
    this.model = model;

    this.profileImages = [];
    this.profileBios = [];
    this.profileTags = [];
    this.profileStats = [];

    this.init();
}

FacebookProfile.prototype.setModel = function(model) {
   this.model = model; 
}

FacebookProfile.prototype.render = function(template, container, callback) {
    var viewTemplate = $(template).html();
    $(container).html(_.template(viewTemplate, this.model)); 

    if (callback) {
        callback(this);
    }
}

FacebookProfile.prototype.init = function(callback) {
    // load everything
    this.name = this.model.name;
    this.id = this.model.id;
  
    this.loadImages(); 
    this.loadBios(); 
    this.loadTags();
    this.loadStats();
   
    if (callback) {
        callback(this);
    }
}

FacebookProfile.prototype.loadTags = function(callback) {
    var tagFields = [
        'location',
        'current_location',
        'hometown',
        'genre',
        'record_label'
    ];

    for (var f in tagFields) {
        var field = tagFields[f];
        if (this.model[field] && typeof this.model[field] === "string") {
            this.profileTags.push(this.model[field]);
        }
    }

    if (callback) {
        callback(this.profileTags);
    }
}

FacebookProfile.prototype.loadBios = function(callback) {
    if (this.model.bio) {
        this.profileBios.push(this.model.bio.summary);
    }

    if (this.model.about) {
        this.profileBios.push(this.model.about);
    }

    if (callback) {
        callback(this.profileBios);
    }
}

FacebookProfile.prototype.loadStats = function(callback) {
    if (this.model.likes) {
        this.profileStats.push({
            "likes": this.model.likes
        });
    }
    if (this.model.talking_about_count) {
        this.profileStats.push({
            "talking_about_count": this.model.talking_about_count
        });
    }

    if (callback) {
        callback(this.profileStats);
    }
}

FacebookProfile.prototype.loadImages = function(callback) {
    if (this.model.cover) {
        this.profileImages.push(this.model.cover.source);
    }

    if (callback) {
        callback(this.profileImages);
    }
} 
