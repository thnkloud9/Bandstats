define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var spotifyLookupItemModel = Backbone.Model.extend({
    urlRoot: '/admin/spotify/search',

    idAttribute: "name",

    defaults: {
      band_id: 0,
      name: '',
      uri: '',
      popularity: 0,
      followers: {
        "total": 0
      },
      images: [
	    {
	      "url": "/images/no_image.jpeg"
	    },
	    {
	      "url": "/images/no_image.jpeg"
	    },
	    {
	      "url": "/images/no_image.jpeg"
	    },
      ],
    },

    initialize: function() {

    }

  });

  return spotifyLookupItemModel;

});
