define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var jobModel = Backbone.Model.extend({
    urlRoot: '/admin/job',

    idAttribute: "job_id",

    defaults: {
      job_id: 0,
      job_name: '',
      job_processed: '',
      job_last_updated: '',
      job_last_run: '',
      job_duration: '',
      job_active: '',
      job_arguments: '',
      job_command: '',
      job_description: '',
      job_failed: '',
      job_schedule: '',
      job_category: '',
      pids: '',
      last_output: '',
    },

    initialize: function() {

    }

  });

  return jobModel;

});
