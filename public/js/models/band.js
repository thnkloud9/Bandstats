define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var bandModel = Backbone.Model.extend({
    urlRoot: '/admin/band',

    defaults: {
      band_id: 0,
      band_name: '',
      band_image_src: '',
      band_url: '',
      regions: [],
      genres: [],
      mentions: [],
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

    }

  });

  return bandModel;

});
