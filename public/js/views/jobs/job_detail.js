define([
  'jquery',
  'underscore',
  'backbone',
  'models/job',
  'collections/jobs',
  'text!templates/jobs/job_detail.html'
], function($, _, Backbone, JobModel, JobCollection, template) {

  var JobDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
    },

    events: {
      'click #job-save': 'saveJob',
      'click #job-delete': 'deleteJob',
    }, 

    loadJob: function (id) {
      this.model = new JobModel({job_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      console.log(this.model.attributes);

      $(this.el).html(this.template(this.model.attributes));

      return this;
    },

    saveJob: function(ev) {
      ev.preventDefault();

      this.model.set({
          job_name: $('#job-name').val(),
          job_command: $('#job-command').val(),
          job_arguments: $('#job-arguments').val(),
          job_schedule: $('#job-schedule').val(),
          job_description: $('#job-description').val(),
          job_active: $('job-active').is(':checked')
      });

      // remove id if this is a new model
      if (this.model.get('job_id') === "0") {
        this.model.set('job_id', null);
      }

      this.model.save(null, {
        success: function(job, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(job, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
      
    },

    deleteJob: function(ev) {
      ev.preventDefault();
      console.log('delete job ' + this.model.get('job_id'));
      this.model.destroy({success: function(model, response) {
        $('.flash-message').addClass('alert-success').text("Success").show();
      }});
    }

  });

  return JobDetailView;

}); 
