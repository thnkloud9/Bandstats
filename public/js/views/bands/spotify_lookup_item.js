define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/spotify_lookup_item.html' 
], function($, _, Backbone, BandModel, template) {

  var SpotifyLookupItemView = Backbone.View.extend({
    el: '#spotify-lookup-results',
    tagName: "li",
    template: _.template(template),

    events: {
      'click .lnk-spotify-lookup-select': 'updateSpotifyId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      return this;
    },

    updateSpotifyId: function(ev) {
      var parent = this;
      var spotifyId = String($(ev.currentTarget).data("spotify-id"));
      parent.trigger('updateSpotifyId', spotifyId);
    }

  });

  return SpotifyLookupItemView;

}); 
