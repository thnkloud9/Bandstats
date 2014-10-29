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
        'click .band-deactivate': 'deactivateBand'
    },

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
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
    }

  });

  return BandListItemView;

}); 
