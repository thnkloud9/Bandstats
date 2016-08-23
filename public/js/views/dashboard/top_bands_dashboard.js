define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/top_bands_dashboard.html',
  'chart', 
], function($, _, Backbone, template) {

  var TopBandsDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    template: _.template(template),
    data: {},

    initialize: function () {
    },

    render: function () {
      $(this.el).html( this.template() );

      //this.getData();

      return this;
    },

    getData: function () {
      var parent = this;
      var url = '/admin/dashboard/topBandStats'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  parent.renderTopBandsChart(data);
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      });
    },

    renderTopBandsChart: function (data) {

    }

  });

  return TopBandsDashboardView;

}); 
