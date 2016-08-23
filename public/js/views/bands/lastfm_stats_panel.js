define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/lastfm_lookup_item',
  'views/bands/lastfm_lookup_item',
  'text!templates/bands/lastfm_stats_panel.html' 
], function($, _, Backbone, Vm,
    LastfmLookupItemModel,
    LastfmLookupItemView,
    template) {

  var LastfmStatsPanelView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    initialize: function (options) {
      this.vent = options.vent;
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      this.model.bind("fetch", this.render, this);

      if (this.vent) {
        this.listenTo(this.vent, "lastfmStatsPanel.lookupLastfmId", this.lookupLastfmId);
        this.listenTo(this.vent, "lastfmStatsPanel.collectLastfmLikes", this.collectLastfmLikes);
        this.listenTo(this.vent, "lastfmStatsPanel.clearLastfmId", this.clearLastfmId);
        this.listenTo(this.vent, "lastfmStatsPanel.viewLastfmProfile", this.viewLastfmProfile);
      }
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    clearLastfmId: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      var externalIds = this.model.get('external_ids');
      externalIds.lastfm_id = "";

      var runningStats = this.model.get('running_stats');
      runningStats.lastfm_listeners = {
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
          parent.render();
        },
        error: function(band, saveResponse) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    collectLastfmLikes: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      console.log('requesting lastfm likess for ' + bandId);

      $('#admin-modal-title').html('Facebook Collect Likes: ' + this.model.get('band_name'));

      $.ajax("/admin/job/5/start?args=-p lastfm -r getListeners -f lastfm_listeners -i " + bandId + " update", {
        type: "GET",
        dataType: "json",
          success: function(data) {
            $('.flash-message').addClass('alert-success').text("Success").show();
            // refresh in 5 secods
            setTimeout(function(){
              parent.render();
              //parent.model.fetch();
              //parent.trigger('refreshParent');
            }, 5000);
          },
         error: function(data) {
	       console.log('error: ' + data);
         }
      }); 	
    },

    viewLastfmProfile: function (ev) {
      var parent = this;
      var lastfmId = this.model.attributes.external_ids.lastfm_id;
      var bandId = $(ev.currentTarget).data("band-id");

      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      require(['views/modal'], function (ModalView) {
        var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: {}});
        modalView.render();
        $('#admin-modal').modal('show');
        $('#admin-modal-title').html('Lastfm Profile: ' + lastfmId);

        $.ajax("/admin/lastfm/" + lastfmId, {
          type: "GET",
          dataType: "json",
          success: function(data) {
	        $('.admin-modal-content', this.el).html('<ul id="lastfm-lookup-results" class="list-inline"></ul>');

	        var lastfmLookupItemModel = new LastfmLookupItemModel(data);
            lastfmLookupItemModel.set('band_id', bandId);
            var lastfmLookupItemView = Vm.create(parent, 'LastfmLookupItemView', LastfmLookupItemView, {model: lastfmLookupItemModel});
	        lastfmLookupItemView.render();
          },
          error: function(data) {
	        console.log('error: ' + data);
          }
        }); 	
      });
    },

    lookupLastfmId: function (ev) {
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
        $('#admin-modal-title').html('Lastfm Lookup: ' + search);

        $.ajax("/admin/lastfm/search?search=" + search, {
          type: "GET",
          dataType: "json",
          success: function(data) {
	        $('.admin-modal-content', this.el).html('<ul id="lastfm-lookup-results" class="list-inline"></ul>');

	        _.forEach(data[0].results, function(result) {
	          var lastfmLookupItemModel = new LastfmLookupItemModel(result);
              lastfmLookupItemModel.set('band_id', bandId);
              var lastfmLookupItemView = Vm.create(parent, 'LastfmLookupItemView', LastfmLookupItemView, {model: lastfmLookupItemModel});
	          lastfmLookupItemView.render();
              lastfmLookupItemView.on('updateLastfmId', parent.updateLastfmId, parent);
	        });

          },
          error: function(data) {
	        console.log('error: ' + data);
          }
        }); 	
      });
    },

  updateLastfmId: function(lastfmId) {
    var parent = this;
    var externalIds = this.model.get('external_ids');
    externalIds.lastfm_id = lastfmId;
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

  return LastfmStatsPanelView;

}); 
