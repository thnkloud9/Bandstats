define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/users/user_gallery_item.html' 
], function($, _, Backbone, template) {

  var UserGalleryItemView = Backbone.View.extend({

    tagName: "li",
    className: "span3",
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

  return UserGalleryItemView;

}); 
