define([
  'jquery',
  'underscore',
  'backbone',
  'collections/jobs',
  'views/paginator',
  'views/jobs/job_list_item',
  'views/jobs/running_job_list_item',
  'views/jobs/job_log_item',
  'text!templates/jobs/job_list_jobs_header.html',
  'text!templates/jobs/job_list_running_header.html',
  'text!templates/jobs/job_log_header.html',
  'text!templates/jobs/job_log_menu.html',
  'text!templates/jobs/job_list.html'
], function($, _, Backbone, 
    JobsCollection, 
    PaginatorView, 
    JobListItemView, 
    RunningJobListItemView, 
    JobLogItemView, 
    jobListJobsHeaderTemplate,
    jobListRunningHeaderTemplate,
    jobLogHeaderTemplate,
    jobLogMenuTemplate,
    jobListTemplate){
  var JobListView = Backbone.View.extend({
    el: '#job-list-container',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    events: {
      'click #btn-close-log-output': 'closeLogOutput',
      'click #clear-log': 'clearLog'
    },
    
    closeLogOutput: function() {
      $('#log-output-container').hide();
    },

    clearLog: function () {
      var parent = this;
      $('.flash-message').addClass('alert-warning').text("Processing...").show();
      $.ajax({
          type: 'DELETE',
          url: '/admin/job/clearLog',
          contentType: 'application/json',
          success: function (response) {
            $('.flash-message').removeClass('alert-warning').addClass('alert-success').html("Success").show();
            // clear all rows that are not th rows
            $('#job-list tr').not(function(){if ($(this).has('th').length){return true}}).remove();
          },
          error: function (err, response) {
            console.log("error: " + err.responseText);
            $('.flash-message').addClass('alert-danger').text(response.message).show();
          }
      });
    },

    render: function () {
      // hide any messages
      $('.flash-message').hide();

      this.$el.html(jobListTemplate);

      if (this.collection.getName() == "Jobs") {
          // add table and headers
          $('#job-list', this.el).html(jobListJobsHeaderTemplate);

          var parent = this;
              _.each(this.collection.models, function (model) {
              parent.renderJob(model);
          }, this);
      }

      if (this.collection.getName() == "RunningJobs") {
          // add table and header
          $('#job-list', this.el).html(jobListRunningHeaderTemplate);

          var parent = this;
              _.each(this.collection.models, function (model) {
              parent.renderRunningJob(model);
          }, this);
      }

      if (this.collection.getName() == "JobsLog") {
          // add menu, table, and header
          $('#job-list-menu', this.el).html(jobLogMenuTemplate);
          $('#job-list', this.el).html(jobLogHeaderTemplate);

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
