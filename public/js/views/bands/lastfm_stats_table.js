define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/lastfm_stats_table.html' 
], function($, _, Backbone, template) {

  var LastfmStatsTableView = Backbone.View.extend({

    tagName: "table",
    className: "lastfm-stats-table table table-striped",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }

  });

  return LastfmStatsTableView;

}); 
