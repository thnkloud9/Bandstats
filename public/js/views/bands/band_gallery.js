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

    initialize: function(options) {
      this.vent = options.vent;
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

      var paginatorView = Vm.create(this, 'PaginatorView', PaginatorView, {collection: this.collection, page: this.page}); 
      $('#paginator-content', this.el).html(paginatorView.render().el);

      return this;
    },

    renderBand: function (model) {
      var viewName = 'BandGalleryItemView' + model.get("band_id");
      var bandGalleryItemView = Vm.create(this, viewName, BandGalleryItemView, {model: model, vent: this.vent});
      $('#band-list', this.el).append(bandGalleryItemView.render().el); 
    },

  });
  return BandGalleryView;
});
