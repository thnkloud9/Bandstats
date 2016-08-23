define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/sites_dashboard.html' 
], function($, _, Backbone, template) {

  var SitesDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    template: _.template(template),

    initialize: function () {
    },

    render: function () {
      $(this.el).html( this.template() );
      return this;
    }

  });

  return SitesDashboardView;

}); 
