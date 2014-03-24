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
      created: new Date,
      external_ids: {
        "lastfm_id": "",
        "facebook_id": "",
        "echonest_id": ""
      },
      running_stats: {
        "facebook_likes": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "total_incremental": 0,
            "daily_stats": [] 
        },
        "lastfm_listeners": {
            "current": 0,
            "incremental_avg": 0,
            "incremental_total": 0,
            "last_updated": "",
            "total_incremental": 0,
            "daily_stats": [] 
        }
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
