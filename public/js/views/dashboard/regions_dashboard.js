define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/regions_dashboard.html',
  'chart', 
], function($, _, Backbone, template) {

  var RegionsDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    template: _.template(template),
    data: {},

    initialize: function () {
    },

    render: function () {
      $(this.el).html( this.template() );

      this.getData();

      return this;
    },

    getData: function () {
      var parent = this;
      var url = '/admin/dashboard/regions'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  $('#loading').remove();
	  parent.renderRegionsChart(data);
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      });
    },

    renderRegionsChart: function (data) {
      this.data = data;
    
      var chartLabels = [];
      var chartData = []; 
      _.forEach(data, function(count, region) {
	chartLabels.push(region);
	chartData.push(count);
      });
 
      var regionsChartData = {
	labels : chartLabels,
	datasets : [
	  {
	    fillColor : "rgba(151,187,205,0.5)",
	    strokeColor : "rgba(151,187,205,1)",
	    data : chartData
	  }
	]
      }
      var options = {
	barStrokeWidth : 2,
	barValueSpacing : .5,
	barDatasetSpacing : 2,
      }
      var ctx = $('#chart-regions-bar', this.el).get(0).getContext("2d");
      var regionsChart = new Chart(ctx).Bar(regionsChartData, options);
    }

  });

  return RegionsDashboardView;

}); 
