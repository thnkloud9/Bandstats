define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'collections/bands',
  'views/paginator',
  'views/bands/band_gallery_item',
  'text!templates/bands/band_list.html'
], function($, _, Backbone, Vm, BandsCollection, PaginatorView, BandGalleryItemView, bandListTemplate){
  var BandGalleryView = Backbone.View.extend({

    id: 'bands-gallery-content',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);

      this.$el.html(bandListTemplate);
    },

    render: function () {

      this.$el.empty();
      this.$el.html(bandListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      $('#paginator-content', this.el).html(new PaginatorView({collection: this.collection, page: this.page}).render().el);

      return this;
    },

    renderBand: function (model) {
      $('#band-list', this.el).append(new BandGalleryItemView({model: model}).render().el); 
    }

  });
  return BandGalleryView;
});
