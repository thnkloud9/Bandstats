define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var bandModel = Backbone.Model.extend({

    urlRoot: '/admin/band',

    idAttribute: "band_id",

    defaults: {
      band_id: 0,
      band_name: '',
      band_image_src: '/images/no_image.jpeg',
      band_url: '',
      regions: [],
      genres: [],
      mentions: [],
      mentions_total: 0,
      created: new Date,
      last_updated: new Date,
      active: "true",
      external_ids: {
        lastfm_id: "",
        facebook_id: "",
        echonest_id: ""
      },
      running_stats: {
        facebook_likes: {
            current: 0,
            incremental_avg: 0,
            incremental_total: 0,
            last_updated: "",
            incremental: 0,
            daily_stats: [] 
        },
        lastfm_listeners: {
            current: 0,
            incremental_avg: 0,
            incremental_total: 0,
            last_updated: "",
            incremental: 0,
            daily_stats: [] 
        }
      },
      failed_lookups: {
        facebook: 0,
        lastfm: 0,
        echonest: 0
      }
    },

    initialize: function() {
    },

    parse: function(response) {
        if (response.band_img_src == '') {
            reponse.band_img_src == this.defaults.band_image_src; 
        }

        return response;
    }

  });

  return bandModel;

});
