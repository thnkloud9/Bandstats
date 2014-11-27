define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/spotify_lookup_item',
  'views/bands/spotify_lookup_item',
  'text!templates/bands/spotify_stats_panel.html' 
], function($, _, Backbone, Vm,
    SpotifyLookupItemModel,
    SpotifyLookupItemView,
    template) {

  var SpotifyStatsPanelView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    initialize: function (options) {
      this.vent = options.vent;
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      this.model.bind("fetch", this.render, this);

      if (this.vent) {
        this.listenTo(this.vent, "spotifyStatsPanel.lookupSpotifyId", this.lookupSpotifyId);
        this.listenTo(this.vent, "spotifyStatsPanel.collectSpotifyLikes", this.collectSpotifyLikes);
        this.listenTo(this.vent, "spotifyStatsPanel.clearSpotifyId", this.clearSpotifyId);
        this.listenTo(this.vent, "spotifyStatsPanel.viewSpotifyProfile", this.viewSpotifyProfile);
      }
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    clearSpotifyId: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      console.log('clearing spotify id for ' + bandId);

      var externalIds = this.model.get('external_ids');
      externalIds.spotify_id = "";

      var runningStats = this.model.get('running_stats');
      runningStats.spotify_followers = {
        current: 0,
        incremental_avg: 0,
        incremental_total: 0,
        last_updated: "",
        incremental: 0,
        daily_stats: [] 
      }

      this.model.set({external_ids: externalIds});
      this.model.set({running_stats: runningStats});
      this.model.save(null, {
        success: function(band, saveResponse) {
          console.log(bandId + ' saved');
          $('.flash-message').addClass('alert-success').text("Success").show();
          parent.model.fetch();
          parent.trigger('refreshParent');
        },
        error: function(band, saveResponse) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    collectSpotifyLikes: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      console.log('requesting spotify likess for ' + bandId);

      $('#admin-modal-title').html('Facebook Collect Likes: ' + this.model.get('band_name'));

      $.ajax("/admin/job/5/start?args=-p spotify -r getFollowers -f spotify_followers -i " + bandId + " update", {
        type: "GET",
        dataType: "json",
          success: function(data) {
            $('.flash-message').addClass('alert-success').text("Success").show();
            // refresh in 5 secods
            setTimeout(function(){
              parent.model.fetch();
              parent.trigger('refreshParent');
            }, 5000);
          },
         error: function(data) {
	       console.log('error: ' + data);
         }
      }); 	
    },

    viewSpotifyProfile: function (ev) {
      var parent = this;
      var spotifyId = this.model.attributes.external_ids.spotify_id;
      var bandId = $(ev.currentTarget).data("band-id");

      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      require(['views/modal'], function (ModalView) {
        var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: {}});
        modalView.render();
        $('#admin-modal').modal('show');
        $('#admin-modal-title').html('Spotify Profile: ' + spotifyId);

        $.ajax("/admin/spotify/" + spotifyId, {
          type: "GET",
          dataType: "json",
          success: function(data) {
	        $('.admin-modal-content', this.el).html('<ul id="spotify-lookup-results" class="list-inline"></ul>');
	        var spotifyLookupItemModel = new SpotifyLookupItemModel(data);
            spotifyLookupItemModel.set('band_id', bandId);
            var spotifyLookupItemView = Vm.create(parent, 'SpotifyLookupItemView', SpotifyLookupItemView, {model: spotifyLookupItemModel});
	        spotifyLookupItemView.render();

          },
          error: function(data) {
	        console.log('error: ' + data);
          }
        }); 	
      });
    },

    lookupSpotifyId: function (ev) {
      var parent = this;

      var search = $(ev.currentTarget).data("search");
      var bandId = $(ev.currentTarget).data("band-id");

      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      require(['views/modal'], function (ModalView) {
        var buttons = { save: true };
        var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: buttons});
        modalView.render();
        $('#admin-modal').modal('show');
        $('#admin-modal-title').html('Spotify Lookup: ' + search);

        $.ajax("/admin/spotify/search?search=" + search, {
          type: "GET",
          dataType: "json",
          success: function(data) {
	        $('.admin-modal-content', this.el).html('<ul id="spotify-lookup-results" class="list-inline"></ul>');

	        _.forEach(data[0].results, function(result) {
	          var spotifyLookupItemModel = new SpotifyLookupItemModel(result);
              spotifyLookupItemModel.set('band_id', bandId);
              var spotifyLookupItemView = Vm.create(parent, 'SpotifyLookupItemView', SpotifyLookupItemView, {model: spotifyLookupItemModel});
	          spotifyLookupItemView.render();
	          spotifyLookupItemView.on('updateSpotifyId', parent.updateSpotifyId, parent);
	        });

          },
          error: function(data) {
	        console.log('error: ' + data);
          }
        }); 	
      });
    },

    updateSpotifyId: function(spotifyId) {
      var parent = this;
      var externalIds = this.model.get('external_ids');
      externalIds.spotify_id = spotifyId;
      this.model.set({external_ids: externalIds});
      this.model.save(null, {
        success: function(band, saveResponse) {
          console.log(parent.model.get('band_id') + ' saved');
          $('.flash-message').addClass('alert-success').text("Success").show();
          parent.render();
        },
        error: function(band, saveResponse) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });

    },

  });

  return SpotifyStatsPanelView;

}); 
