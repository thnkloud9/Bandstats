define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var sessionModel = Backbone.Model.extend({

    defaults: {
      session: {
        cookie: {
          expires: null,
          httpOnly: true,
          originalMaxAge: 1000,
          path: "/" 
        },
        passport: {
          user: null
        },
      }, 
      user: {
        username: '',
        user_image_src: '',
        password: '',
        role: 'manager',
        bands: {},
        description: '',
        active: false
      }
    },

    initialize: function() {
      this.fetch();
      this.on('change', this.save, this);
    },

    fetch: function() {
       this.set(JSON.parse(localStorage.getItem(this.id)));
    },

    save: function(attributes) {
       localStorage.setItem(this.id, JSON.stringify(this.toJSON()));
    },

    destroy: function(options) {
       localStorage.removeItem(this.id);
    },

    isEmpty: function() {
        return (_.size(this.attributes) <= 1); // just 'id'
    }

  });

  return sessionModel;

});
