define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/lastfm_lookup_item.html' 
], function($, _, Backbone, BandModel, template) {

  var LastfmLookupItemView = Backbone.View.extend({
    el: '#lastfm-lookup-results',
    tagName: "li",
    template: _.template(template),

    events: {
      'click .lnk-lastfm-lookup-select': 'updateLastfmId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      return this;
    },

    updateLastfmId: function(ev) {
      var parent = this;
      var lastfmId = String($(ev.currentTarget).data("lastfm-id"));
      parent.trigger('updateLastfmId', lastfmId);
    }

  });

  return LastfmLookupItemView;

}); 
