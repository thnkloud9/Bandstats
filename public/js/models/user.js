define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var userModel = Backbone.Model.extend({
    urlRoot: '/admin/user',

    defaults: {
      user_id: 0,
      username: '',
      user_image_src: '',
      password: '',
      role: 'manager',
      bands: {}
    },

    initialize: function() {

    }

  });

  return userModel;

});
