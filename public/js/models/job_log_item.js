define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var jobLogModel = Backbone.Model.extend({
    urlRoot: '/admin/job/log',

    idAttribute: "_id",

    defaults: {
      job_id: 0,
      job_name: '',
      job_processed: 0,
      job_last_duration: '',
      job_arguments: '',
      job_description: '',
      job_failed: 0,
      action: '',
      time: '',
      pid: '',
    },

    initialize: function() {

    }

  });

  return jobLogModel;

});
