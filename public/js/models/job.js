define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var bandModel = Backbone.Model.extend({
    urlRoot: '/admin/band',

    defaults: {
      job_id: 0,
      job_name: '',
      job_processed: '',
      job_last_updated: '',
      job_last_run: '',
      job_active: '',
      job_arguments: '',
      job_command: '',
      job_description: '',
      job_failed: '',
      job_schedule: '',
      pids: '',
    },

    initialize: function() {

    }

  });

  return bandModel;

});
