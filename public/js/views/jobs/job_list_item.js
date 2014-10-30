define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/jobs/job_list_item.html',
  'moment'
], function($, _, Backbone, template, moment) {

  var JobListItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    events: {
      'click .btn-run-job': 'runJob',
      'click .job-activate': 'activateJob',
      'click .job-deactivate': 'deactivateJob',
      'click .job-delete': 'deleteJob'
    },

    render: function () {
      // convert duration and dates to readable format
      if (this.model.attributes.job_duration != '') {
        var duration = moment.duration(this.model.attributes.job_duration).humanize();
        this.model.set({readable_duration: duration});
      } else {
        this.model.set({readable_duration: 'never run'});
      }  

      if (this.model.attributes.job_last_run != '') {
        var last_run = moment.utc(this.model.attributes.job_last_run).format("dddd, MMMM Do YYYY, h:mm:ss a");
        this.model.set({readable_last_run: last_run});
      } else {
        this.model.set({readable_last_run: 'never run'});
      }  
 
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    runJob: function (ev) {
        // trigger start job via api
        var url = "/admin/job/" + this.model.get('job_id') + "/start";

        $.ajax({
            url:url,
            type:'GET',
            dataType:"json",
            success:function (response) {
                $('.flash-message').addClass('alert-success').text('Sucess').show();
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

    deleteJob: function () {
      parent = this;
      this.model.destroy({
        success: function(job, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
          parent.undelegateEvents();
          parent.unbind();
          parent.remove();
          parent.off();
        }
      });
    },

    activateJob: function () {
      console.log('Updating job ' + this.model.get('job_id'));
      parent = this;
      this.model.set({ job_active: "true" });

      this.model.save(null, {
        success: function(job, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(job, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },

    deactivateJob: function () {
      parent = this;
      this.model.set({ job_active: "false" });

      this.model.save(null, {
        success: function(job, response) {
          parent.render();
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(job, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    }

  });

  return JobListItemView;

}); 
