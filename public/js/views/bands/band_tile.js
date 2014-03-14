define([
  'jquery',
  'underscore',
  'backbone',
  'collections/bands',
  'views/paginator',
  'views/bands/band_tile_item',
  'text!templates/bands/band_list.html'
], function($, _, Backbone, BandsCollection, PaginatorView, BandTileItemView, bandListTemplate){
  var BandTileView = Backbone.View.extend({

    el: '#band-list-container',

    page: 1, 

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    render: function () {

      this.$el.html(bandListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      $('#pagination', this.el).html(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderBand: function (model) {
      $('#band-list', this.el).append(new BandTileItemView({model: model}).render().el); 
    }

  });
  return BandTileView;
});
