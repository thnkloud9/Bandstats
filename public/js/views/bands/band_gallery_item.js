define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/facebook_stats_panel',
  'views/bands/lastfm_stats_panel',
  'text!templates/bands/band_gallery_item.html' 
], function($, _, Backbone, Vm, FacebookStatsPanelView, LastfmStatsPanelView, template) {

  var BandGalleryItemView = Backbone.View.extend({

    tagName: "li",
    className: "span3",
    template: _.template(template),

    events: {
        'click .band-delete': 'deleteBand',
        'click .band-activate': 'activateBand',
        'click .band-deactivate': 'deactivateBand',
        'click .activate-mentions': 'activateMentions',
        'click .deactivate-mentions': 'deactivateMentions'
    },

    initialize: function (options) {
      this.vent = options.vent;
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));

      var viewName = 'FacebookStatsPanelView' + this.model.get("band_id");
      var facebookStatsPanelView = Vm.create(this, viewName, FacebookStatsPanelView, {model: this.model, vent: this.vent});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el)); 

      var viewName = 'LastfmStatsPanelView' + this.model.get("band_id");
      var lastfmStatsPanelView = Vm.create(this, viewName, LastfmStatsPanelView, {model: this.model, vent: this.vent});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el)); 

      return this;
    },

    deleteBand: function () {
      parent = this;
      this.model.destroy({
        success: function(band, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
          parent.undelegateEvents();
          parent.unbind();
          parent.remove();
          parent.off();
        }
      });
    },
    
    activateBand: function () {
      parent = this;
      this.model.set({ active: "true" });

      this.model.save(null, {
        success: function(band, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    deactivateBand: function () {
      parent = this;
      this.model.set({ active: "false" });

      this.model.save(null, {
        success: function(band, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },
    
    activateMentions: function () {
      parent = this;
      this.model.set({ article_matching: "true" });

      this.model.save(null, {
        success: function(band, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    deactivateMentions: function () {
      parent = this;
      this.model.set({ article_matching: "false" });
      this.model.set({ mentions_total: 0 });
      this.model.set({ mentions: [] });

      this.model.save(null, {
        success: function(band, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    }
 
  });

  return BandGalleryItemView;

}); 
