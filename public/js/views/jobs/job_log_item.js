define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/jobs/job_log_item.html',
  'moment',
  'bootstrap'
], function($, _, Backbone, template, moment) {

  var JobLogItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);

      if (this.model.attributes.action === "started") {
	    this.$el.addClass('success');;
      }

      //if (this.model.attributes.action === "ended") {
      //  this.$el.addClass('danger');;
      //}
    },

    render: function () {
      // convert duration and times to readable format
      var duration = moment.duration(this.model.attributes.job_last_duration).humanize();
      this.model.set({readable_duration: duration});

      var start = moment(this.model.attributes.time, 'YYYY-MM-DD hh:mm:ss').format("dddd, MMMM Do YYYY, h:mm:ss a");
      this.model.set({readable_start: start});
 
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

  });

  return JobLogItemView;

}); 
