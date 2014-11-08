define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/facebook_lookup_item',
  'views/bands/facebook_lookup_item',
  'text!templates/bands/facebook_stats_panel.html' 
], function($, _, Backbone, Vm, 
    FacebookLookupItemModel,
    FacebookLookupItemView,
    template) {

  var FacebookStatsPanelView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    initialize: function (options) {
      this.vent = options.vent;
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      this.model.bind("fetch", this.render, this);

      if (this.vent) {
        this.listenTo(this.vent, "facebookStatsPanel.lookupFacebookId", this.lookupFacebookId);
        this.listenTo(this.vent, "facebookStatsPanel.collectFacebookLikes", this.collectFacebookLikes);
        this.listenTo(this.vent, "facebookStatsPanel.clearFacebookId", this.clearFacebookId);
        this.listenTo(this.vent, "facebookStatsPanel.viewFacebookProfile", this.viewFacebookProfile);
      }
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));

      return this;
    },

    clearFacebookId: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      console.log('clearing facebook id for ' + bandId);

      var externalIds = this.model.get('external_ids');
      externalIds.facebook_id = "";

      var runningStats = this.model.get('running_stats');
      runningStats.facebook_likes = {
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

    collectFacebookLikes: function (ev) {
      var parent = this;
      var bandId = $(ev.currentTarget).data("band-id");
      if (bandId != this.model.attributes.band_id) {
        return false;
      }

      console.log('requesting facebook likess for ' + bandId);

      $('#admin-modal-title').html('Facebook Collect Likes: ' + this.model.get('band_name'));

      $.ajax("/admin/job/5/start?args=-p facebook -r getPageLikes -f facebook_likes -i " + bandId + " update", {
        type: "GET",
        dataType: "json",
          success: function(data) {
            $('.flash-message').addClass('alert-success').text("Success, results will auto refresh in 5 seconds").show();
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

    viewFacebookProfile: function (ev) {
      var parent = this;
      var facebookId = this.model.attributes.external_ids.facebook_id;

      if (facebookId === "") {
        return false;
      }

      require(['views/modal'], function (ModalView) {
        var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: {}});
        modalView.render();
        $('#admin-modal').modal('show');
        $('#admin-modal-title').html('Facebook Profile: ' + facebookId);

        $.ajax("/admin/facebook/" + facebookId, {
          type: "GET",
          dataType: "json",
          success: function(data) {
	        $('.admin-modal-content', this.el).html('<ul id="facebook-lookup-results" class="list-inline"></ul>');
            
	        var facebookLookupItemModel = new FacebookLookupItemModel(data);
            facebookLookupItemModel.set('band_id', bandId);
            var facebookLookupItemView = Vm.create(parent, 'FacebookLookupItemView', FacebookLookupItemView, {model: facebookLookupItemModel});
	        facebookLookupItemView.render();

          },
          error: function(data) {
	        console.log('error: ' + data);
          }
        }); 	
      });
    },

    lookupFacebookId: function (ev) {
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
        $('#admin-modal-title').html('Facebook Lookup: ' + search);

        $.ajax("/admin/facebook/search?search=" + search, {
          type: "GET",
          dataType: "json",
            success: function(data) {
	          $('.admin-modal-content', this.el).html('<ul id="facebook-lookup-results" class="list-inline"></ul>');

	         _.forEach(data[0].results, function(result) {
	           var facebookLookupItemModel = new FacebookLookupItemModel(result);
               facebookLookupItemModel.set('band_id', bandId);
               var facebookLookupItemView = Vm.create(parent, 'FacebookLookupItemView', FacebookLookupItemView, {model: facebookLookupItemModel});
	           facebookLookupItemView.render();
             });

            },
           error: function(data) {
	         console.log('error: ' + data);
           }
        }); 	
      });
    },


  });

  return FacebookStatsPanelView;

}); 
