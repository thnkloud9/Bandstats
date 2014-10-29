define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/jobs/job_list',
  'text!templates/jobs/jobs_page.html'
], function($, _, Backbone, Vm, JobListView, jobsPageTemplate){
  var JobsPage = Backbone.View.extend({
    el: '#content',
    template: _.template(jobsPageTemplate),

    initialize: function(options) {
        this.breadcrumb = options.breadcrumb;
    },

    render: function () {
      var templateData = {breadcrumb: this.breadcrumb};
      this.$el.html(this.template(templateData));
      this.renderJobList();
    },

    renderJobList: function() {
      var jobsCollection = this.collection;

      var jobsListView = Vm.create(this, 'JobListView', JobListView, {collection: jobsCollection});
      jobsListView.render();

    },

    close: function () {
      this.destroyChildren();
      this.undelegateEvents();
      this.unbind();
    },

    destroyChildren: function () {
      var parent = this;
      _.each(this.children, function(child, name) {
        if (typeof child.close === 'function') {
          child.close();
        }
        child.remove();
        child.undelegateEvents();
        child.unbind();
      }, this);
      this.children = {};
    }

  });
  return JobsPage;
});
