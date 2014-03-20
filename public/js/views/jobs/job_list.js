define([
  'jquery',
  'underscore',
  'backbone',
  'collections/jobs',
  'views/paginator',
  'views/jobs/job_list_item',
  'views/jobs/running_job_list_item',
  'views/jobs/job_log_item',
  'text!templates/jobs/job_list.html'
], function($, _, Backbone, JobsCollection, PaginatorView, JobListItemView, RunningJobListItemView, JobLogItemView, jobListTemplate){
  var JobListView = Backbone.View.extend({
    el: '#job-list-container',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    events: {
        'click #btn-close-log-output': 'closeLogOutput'
    },
    
    closeLogOutput: function() {
        $('#log-output-container').hide();
    },

    render: function () {
      // hide any messages
      $('.flash-message').hide();

      this.$el.html(jobListTemplate);

      if (this.collection.getName() == "Jobs") {
          // add table and headers
          $('#job-list', this.el).html('<thead>');
          $('#job-list', this.el).append('<th>Name</th>');
          $('#job-list', this.el).append('<th>Last Run</th>');
          $('#job-list', this.el).append('<th>Duration</th>');
          $('#job-list', this.el).append('<th>Processed</th>');
          $('#job-list', this.el).append('<th>Failed</th>');
          $('#job-list', this.el).append('<th>Schedule</th>');
          $('#job-list', this.el).append('<th>Active</th>');
          $('#job-list', this.el).append('<th>Tools</th>');
          $('#job-list', this.el).append('</thead>');

          var parent = this;
              _.each(this.collection.models, function (model) {
              parent.renderJob(model);
          }, this);
      }

      if (this.collection.getName() == "RunningJobs") {
          // add table and header
          $('#job-list', this.el).html('<thead>');
          $('#job-list', this.el).append('<th>Name</th>');
          $('#job-list', this.el).append('<th>Started</th>');
          $('#job-list', this.el).append('<th>Duration</th>');
          $('#job-list', this.el).append('<th>Tools</th>');
          $('#job-list', this.el).append('</thead>');

          var parent = this;
              _.each(this.collection.models, function (model) {
              parent.renderRunningJob(model);
          }, this);
      }

      if (this.collection.getName() == "JobsLog") {
              // add table and header
          $('#job-list', this.el).html('<thead>');
          $('#job-list', this.el).append('<th>Name</th>');
          $('#job-list', this.el).append('<th>Time</th>');
          $('#job-list', this.el).append('<th>Action</th>');
          $('#job-list', this.el).append('<th>Duration</th>');
          $('#job-list', this.el).append('<th>Processed</th>');
          $('#job-list', this.el).append('<th>Failures</th>');
          $('#job-list', this.el).append('<th>Pid</th>');
          $('#job-list', this.el).append('</thead>');

          var parent = this;

          _.each(this.collection.models, function (model) {
              parent.renderJobLog(model);
          }, this);
      }

      $('#paginator-content', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderJob: function (model) {
      $('#job-list', this.el).append(new JobListItemView({model: model}).render().el); 
    },

    renderRunningJob: function (model) {
      $('#job-list', this.el).append(new RunningJobListItemView({model: model}).render().el); 
    },

    renderJobLog: function (model) {
      $('#job-list', this.el).append(new JobLogItemView({model: model}).render().el); 
    }

  });
  return JobListView;
});
