define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/dashboard/active_job_stat',
  'models/job',
  'text!templates/dashboard/jobs_dashboard.html' 
], function($, _, Backbone, Vm, ActiveJobStatView, JobModel, template) {

  var JobsDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    id: 'jobs-dashboard-widget',
    template: _.template(template),

    initialize: function () {
    },

    render: function () {
      $(this.el).html( this.template() );
      this.getData(); 
      return this;
    },

    getData: function () {
      var parent = this;
      var url = '/admin/dashboard/activeJobStats'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  _.forEach(data, function(job) {
	      parent.renderActiveJobStat(job);
	  });
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      })
    },

    renderActiveJobStat: function(job) {
      var jobModel = new JobModel(job);

      var activeJobStatView = Vm.create(this, 'ActiveJobStatView', ActiveJobStatView, {model: jobModel});
      $(activeJobStatView.render().el).appendTo($('#active-job-stat-content', this.el));
    }

  });

  return JobsDashboardView;

}); 
