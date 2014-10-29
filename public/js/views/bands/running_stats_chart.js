define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/bands/running_stats_chart.html',
  'chart'
], function($, _, Backbone, Vm, template) {

  var RunningStatsChartView = Backbone.View.extend({

    tagName: "div",
    className: "panel panel-default",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {


      $(this.el).html( this.template() );

      var dateLabels = [];
      var facebookLikesData = [];
      _.forEach(this.model.attributes.running_stats.facebook_likes.daily_stats, function(stat) {
        dateLabels.push(stat.date);
        facebookLikesData.push(stat.value);	
      });

      var chartData = {
        labels : dateLabels,
        datasets : [
		  {
			fillColor : "rgba(220,220,220,0.5)",
			strokeColor : "rgba(220,220,220,1)",
			pointColor : "rgba(220,220,220,1)",
			pointStrokeColor : "#fff",
			data : facebookLikesData
		  }
        ]
      }
      var chartOptions = {};

      var ctx = $('#chart-running-stats', this.el).get(0).getContext("2d");
      var runningStatsChart = new Chart(ctx).Line(chartData,chartOptions);

      return this;
    },

  });

  return RunningStatsChartView;

}); 
