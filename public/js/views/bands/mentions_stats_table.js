define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/mentions_stats_table.html' 
], function($, _, Backbone, template) {

  var MentionsStatsTableView = Backbone.View.extend({

    tagName: "table",
    className: "mentions-stats-table table table-striped",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      $('.bs-tooltip').tooltip();
      return this;
    }

  });

  return MentionsStatsTableView;

}); 
