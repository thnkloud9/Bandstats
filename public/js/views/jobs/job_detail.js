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
      'click #job-run': 'runJob',
    }, 

    runJob: function (ev) {
      // trigger start job via api
      var url = "/admin/job/" + this.model.get('job_id') + "/start";

      $.ajax({
        url:url,
        type:'GET',
        dataType:"json",
        success:function (response) {
          var html = "<a href='#running_jobs'>Running Jobs</a> or <a href='#jobs_log'>Job Log</a>";
          $('.flash-message').addClass('alert-success').html('Success ' + html).show();
        },
        error: function (response) {
          if(response.message) {  // If there is an error, show the error messages
            $('.flash-message').text(response.message).show();
          } else { // If not, just say something went wrong
            $('.flash-message').addClass('alert-danger').text('Internal Error.  Please try again later').show();
          }
        }
      }); 
    },

    loadJob: function (id) {
      this.model = new JobModel({job_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
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
          job_category: $('#job-category option:selected').text().trim(),
          job_description: $('#job-description').val(),
          job_active: ($('#job-active').prop('checked')) ? "true" : "false"
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
