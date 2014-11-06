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
      console.log('here');
      this.model.set("mentions_total", 0);
      this.model.set("mentions_this_period", 0);
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
      var now = moment().format('YYYY-MM-DD'); 
      var lastWeek = moment().subtract('days', 7).format('YYYY-MM-DD'); 
      var lastMonth = moment().subtract('months', 1).format('YYYY-MM-DD'); 

      var total = 0;
      var total_this_week = 0;
      var total_this_month = 0;

      _.forEach(this.model.attributes.mentions, function (mention) {
        total++;
	    if (mention.date >= lastWeek) {
	      total_this_week++;
	    }
	    if (mention.date >= lastMonth) {
	      total_this_month++;
	    }	
      });

      var externalIds = this.model.get("external_ids");
 
      var data = {
	    total: total,
	    total_this_week: total_this_week,
	    mentions_this_period: this.model.get("mentions_this_period"),
	    last_updated: now,
        mentions_id: externalIds.mentions_id,
        band_id: this.model.get("band_id"),
      }
      $(this.el).html(this.template(data));
      $('.bs-tooltip').tooltip();
    
      return this;
    },

  });

  return MentionsStatsPanelView;

}); 
