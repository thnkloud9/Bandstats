define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var lastfmLookupItemModel = Backbone.Model.extend({
    urlRoot: '/admin/lastfm/search',

    idAttribute: "name",

    defaults: {
      band_id: 0,
      name: '',
      mbid: '',
      url: '',
      listeners: 0,
      image: [
	{
	  "#text": "/images/no_image.jpeg",
	  "size": "small"
	},
	{
	  "#text": "/images/no_image.jpeg",
	  "size": "medium"
	},
	{
	  "#text": "/images/no_image.jpeg",
	  "size": "large"
	},
      ],
    },

    initialize: function() {

    }

  });

  return lastfmLookupItemModel;

});
