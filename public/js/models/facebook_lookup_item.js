define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var facebookLookupItemModel = Backbone.Model.extend({
    urlRoot: '/admin/facebook/search',

    idAttribute: "id",

    defaults: {
      username: '',
      name: '',
      bio: '',
      about: '',
      description: '',
      hometown: '',
      current_location: '',
      website: '',
      genre: '',
      link: '',
      likes: 0,
      talking_about_count: 0,
      cover: {
	source: '/images/no_image.jpeg'
      },
    },

    initialize: function() {

    }

  });

  return facebookLookupItemModel;

});
