define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var bandModel = Backbone.Model.extend({
    urlRoot: '/admin/band',

    defaults: {
      band_name: ''
    },
    initialize: function() {

    }

  });

  return bandModel;

});
