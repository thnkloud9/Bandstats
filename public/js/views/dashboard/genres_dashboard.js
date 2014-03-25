define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/genres_dashboard.html',
  'chart', 
], function($, _, Backbone, template) {

  var GenresDashboardView = Backbone.View.extend({

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
      var url = '/admin/dashboard/genres'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  $('#loading').remove();
	  parent.renderGenresChart(data);
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      });
    },

    renderGenresChart: function (data) {
      this.data = data;
    
      var chartLabels = [];
      var chartData = []; 
      _.forEach(data, function(count, genre) {
	chartLabels.push(genre);
	chartData.push(count);
      });
 
      var genresChartData = {
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
	barValueSpacing : 0.5,
	barDatasetSpacing : 2,
      }
      var ctx = $('#chart-genres-bar', this.el).get(0).getContext("2d");
      var genresChart = new Chart(ctx).Bar(genresChartData, options);
    }

  });

  return GenresDashboardView;

}); 
