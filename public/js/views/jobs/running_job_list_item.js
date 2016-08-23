define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/jobs/running_job_list_item.html',
  'moment',
  'bootstrap'
], function($, _, Backbone, Vm, template, moment) {

  var JobListItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    events: {
        'click #btn-view-output': 'viewOutput',
    },

    render: function () {
      // convert duration and times to readable format
      var duration = moment.duration(this.model.attributes.running_time).humanize();
      this.model.set({readable_duration: duration});

      var start = moment(this.model.attributes.time, 'YYYY-MM-DD hh:mm:ss').format("dddd, MMMM Do YYYY, h:mm:ss a");
      this.model.set({readable_start: start});
 
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    // display relatime output from running jobs
    viewOutput: function () {
      var url = "/admin/job/running";
      var parent = this;

      require(['views/modal'], function (ModalView) {
        var buttons = { };
        var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: buttons});
        modalView.render();
        $('#admin-modal').modal('show');
        $('#admin-modal-title').html('Job Output');

        // use ajax to get latest output
        $.ajax({
          url:url,
          type:'GET',
          dataType:"json",
          success:function (response) {
            if(response.running_jobs_json) { 
              _.each(JSON.parse(response.running_jobs_json), function (job) {
                if (job.pid == parent.model.get('pid')) {
                  // display output
                  $('.admin-modal-content').html('<pre id="log-output-content"><small>' + job.output.replace("\n","<br>") + '</small></pre>');
                }
              }, this);
            } else { 
              $('.flash-message').addClass('alert-danger').text('No running jobs at the moment').show();
            }
          },
          error: function (response) {
            $('.flash-message').addClass('alert-danger').text('Internal Server Error').show();
          }
        });
      });
        
    },

  });

  return JobListItemView;

}); 
