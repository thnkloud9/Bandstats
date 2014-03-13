define([
  'jquery',
  'underscore',
  'backbone',
  'collections/jobs',
  'views/paginator',
  'views/jobs/job_list_item',
  'text!templates/jobs/job_list.html'
], function($, _, Backbone, JobsCollection, PaginatorView, JobListItemView, jobListTemplate){
  var JobListView = Backbone.View.extend({
    el: '#job-list-container',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    page: 1,

    render: function () {

      this.$el.html(jobListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        console.log(model);
        parent.renderJob(model);
      }, this);

      $('#pagination', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderJob: function (model) {
      $('#job-list', this.el).append(new JobListItemView({model: model}).render().el); 
    }

  });
  return JobListView;
});
