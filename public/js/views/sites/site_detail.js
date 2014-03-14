define([
  'jquery',
  'underscore',
  'backbone',
  'models/site',
  'text!templates/sites/site_detail.html' 
], function($, _, Backbone, SiteModel, template) {

  var SiteDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
    },

    loadSite: function (id) {
      this.model = new SiteModel({id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));
      return this;
    }

  });

  return SiteDetailView;

}); 
