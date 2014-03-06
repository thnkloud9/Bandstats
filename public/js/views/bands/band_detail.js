define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/band_detail.html' 
], function($, _, Backbone, BandModel, template) {

  var BandDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
    },

    loadBand: function (id) {
      this.model = new BandModel({id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));
      return this;
    }

  });

  return BandDetailView;

}); 
