define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/jobs/page.html'
], function($, _, Backbone, Vm, jobsPageTemplate){
  var JobsPage = Backbone.View.extend({
    el: '#content',
    render: function () {
      this.$el.html(jobsPageTemplate);
    },
  });
  return JobsPage;
});
