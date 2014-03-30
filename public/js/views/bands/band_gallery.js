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
      this.destroyChildren();
      this.$el.empty();
      this.$el.html(bandListTemplate);

      this.destroyChildren();

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      var paginatorView = Vm.create(this, 'PaginatorView', PaginatorView, {collection: this.collection, page: this.page}); 
      $('#paginator-content', this.el).html(paginatorView.render().el);

      return this;
    },

    renderBand: function (model) {
      var bandGalleryItemView = Vm.create(this, 'BandGalleryItemView', BandGalleryItemView, {model: model, vent: this.vent});
      $('#band-list', this.el).append(bandGalleryItemView.render().el); 
    },

    destroyChildren: function() {
      var parent = this;
      _.each(this.children, function(child, name) {
        if (typeof child.close === 'function') {
          child.close();
        }
        child.remove();
        child.undelegateEvents();
        child.unbind();
      }, this);
      this.children = {};
    }


  });
  return BandGalleryView;
});
