define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/bands/mentions_stats_panel.html',
  'moment'
], function($, _, Backbone, Vm, template) {

  var MentionsStatsPanelView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    events: {
      'click #lnk-mentions-clear': 'clearMentions',
    },

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    clearMentions: function () {
      this.model.set("mentions_total", 0);
      this.model.set("mentions_this_period", 0);
      this.model.set("mentions_score_total", 0);
      this.model.set("mentions_score_this_period", 0);
      this.model.set("mentions", []);
       
      this.model.save(null, {
        success: function(band, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));
      $('.bs-tooltip').tooltip();
    
      return this;
    },

  });

  return MentionsStatsPanelView;

}); 
