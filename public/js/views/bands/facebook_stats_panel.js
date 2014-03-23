define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/bands/facebook_stats_panel.html' 
], function($, _, Backbone, Vm, template) {

  var FacebookStatsPanelView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));

      return this;
    },

  });

  return FacebookStatsPanelView;

}); 
