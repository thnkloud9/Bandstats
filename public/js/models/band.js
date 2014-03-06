define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var bandModel = Backbone.Model.extend({
    urlRoot: '/admin/band',

    defaults: {
      band_id: 0,
      band_name: '',
      band_image_src: ''
    },
    initialize: function() {

    }

  });

  return bandModel;

});
