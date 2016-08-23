define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/band_list_item.html' 
], function($, _, Backbone, template) {

  var BandListItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
    template: _.template(template),

    events: {
        'click .band-delete': 'deleteBand',
        'click .band-activate': 'activateBand',
        'click .band-deactivate': 'deactivateBand',
        'click .activate-mentions': 'activateMentions',
        'click .deactivate-mentions': 'deactivateMentions'
    },

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      var failedLookups = this.model.get("failed_lookups");
      if (parseInt(failedLookups.facebook + failedLookups.lastfm + failedLookups.spotify) > 0) {
        this.$el.addClass('danger');
      }
      $('.bs-tooltip').tooltip();
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    renderBand: function (model) {
      $('#band-list-table', this.el).append(new BandListItemView({model: model}).render().el); 
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
      this.model.set("mentions_total", 0);
      this.model.set("mentions_this_period", 0);
      this.model.set("mentions_score_total", 0);
      this.model.set("mentions_score_this_period", 0);
      this.model.set("mentions", []);

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

  return BandListItemView;

}); 
