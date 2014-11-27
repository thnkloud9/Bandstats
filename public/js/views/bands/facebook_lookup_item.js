define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/facebook_lookup_item.html' 
], function($, _, Backbone, BandModel, template) {

  var FacebookLookupItemView = Backbone.View.extend({
    el: '#facebook-lookup-results',
    tagName: "li",
    template: _.template(template),

    events: {
      'click .lnk-facebook-lookup-select': 'updateFacebookId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      return this;
    },

    updateFacebookId: function(ev) {
      var parent = this;
      var facebookId = String($(ev.currentTarget).data("facebook-id"));
      parent.trigger('updateFacebookId', facebookId);
    }

  });

  return FacebookLookupItemView;

}); 
