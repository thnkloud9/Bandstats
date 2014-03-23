define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/bands/facebook_lookup_item.html' 
], function($, _, Backbone, template) {

  var FacebookLookupItemView = Backbone.View.extend({

    tagName: "div",
    template: _.template(template),

    events: {
      'click .lnk-facebook-lookup-select': 'updateFacebookId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    updateFacebookId: function() {
      console.log('update clicked');
    }

  });

  return FacebookLookupItemView;

}); 
