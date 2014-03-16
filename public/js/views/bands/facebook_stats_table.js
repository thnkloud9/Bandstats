define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/facebook_stats_table.html' 
], function($, _, Backbone, template) {

  var FacebookStatsTableView = Backbone.View.extend({

    tagName: "table",
    className: "facebook-stats-table table table-striped",
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

  return FacebookStatsTableView;

}); 
