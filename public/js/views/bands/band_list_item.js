define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/band_list_item.html' 
], function($, _, Backbone, template) {

  var BandListItemView = Backbone.View.extend({

    tagName: "tr",
    className: "",
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

  return BandListItemView;

}); 
