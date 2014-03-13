define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/jobs/job_list_item.html' 
], function($, _, Backbone, template) {

  var JobListItemView = Backbone.View.extend({

    tagName: "li",
    className: "span10",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }

  });

  return JobListItemView;

}); 
