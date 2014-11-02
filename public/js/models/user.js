define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var userModel = Backbone.Model.extend({
    urlRoot: '/admin/user',
    
    idAttribute: "user_id",

    defaults: {
      username: '',
      user_image_src: '/images/default_profile.jpg',
      password: '',
      role: 'manager',
      bands: {},
      description: '',
      active: false
    },

    initialize: function() {

    }

  });

  return userModel;

});
