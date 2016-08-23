define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/sites/site_list_item.html' 
], function($, _, Backbone, template) {

  var SiteListItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
    template: _.template(template),

    events: {
        'click .site-delete': 'deleteSite',
        'click .site-activate': 'activateSite',
        'click .site-deactivate': 'deactivateSite'
    },

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    deleteSite: function () {
      parent = this;
      this.model.destroy({
        success: function(site, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
          parent.undelegateEvents();
          parent.unbind();
          parent.remove();
          parent.off();
        }
      });
    },
    
    activateSite: function () {
      parent = this;
      this.model.set({ site_active: "true" });

      this.model.save(null, {
        success: function(site, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(site, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    deactivateSite: function () {
      parent = this;
      this.model.set({ site_active: "false" });

      this.model.save(null, {
        success: function(site, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(site, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    }

  });

  return SiteListItemView;

}); 
