define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/active_job_stat.html' 
], function($, _, Backbone, template) {

  var ActiveJobStatView = Backbone.View.extend({

    tagName: "li",
    className: "list-group-item",
    template: _.template(template),

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      console.log('HERE');
    },

    render: function () {
      var total_processed = (this.model.attributes.job_processed + this.model.attributes.job_failed);
      var processed_prcnt = (this.model.attributes.job_processed / total_processed) * 100;
      var failed_prcnt = (this.model.attributes.job_failed / total_processed) * 100;
      this.model.set('processed_prcnt', processed_prcnt);
      this.model.set('failed_prcnt', failed_prcnt);
	
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }

  });

  return ActiveJobStatView;

}); 
