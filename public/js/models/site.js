define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var siteModel = Backbone.Model.extend({
    urlRoot: '/admin/site',

    idAttribute: "site_id",

    defaults: {
      site_id: 0,
      site_name: '',
      site_url: '',
      site_weight: '',
      album_name_field: '',
      band_name_field: '',
      created: '',
      description_field: '',
      last_entry: '',
      last_updated: '',
      link_field: '',
      publish_date_field: '',
      track_name_field: '',
      site_image_src: ''
    },

    initialize: function() {

    }

  });

  return siteModel;

});
