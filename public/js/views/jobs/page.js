define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/jobs/page.html'
], function($, _, Backbone, Vm, jobsPageTemplate){
  var JobsPage = Backbone.View.extend({
    el: '.page',
    render: function () {
      this.$el.html(jobsPageTemplate);
    },
    events: {
      'click .add-view': 'addView'
    },
    counter: 1,
    addView: function () {
      var RandomView = Backbone.View.extend({});
      var randomView = Vm.create(this, 'RandomView ' + this.counter, RandomView);
      this.counter++;
      return false;
    }
  });
  return JobsPage;
});
