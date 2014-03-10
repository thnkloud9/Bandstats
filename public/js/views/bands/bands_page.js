define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/band_list',
  'views/bands/band_gallery',
  'text!templates/bands/bands_page.html',
], function($, _, Backbone, Vm, BandListView, BandGalleryView, bandsPageTemplate){
  var BandsPage = Backbone.View.extend({
    el: '#content',

    initialize: function() {
    },

    events: { 
      'click button#btn-gallery-view': 'renderBandGallery',
      'click button#btn-list-view': 'renderBandList'
    },

    render: function () {
      this.$el.html(bandsPageTemplate);
      this.renderBandGallery();
    },

    renderBandGallery: function (model) {
      var bandsCollection = this.collection;

      var bandGalleryView = Vm.create(this, 'BandGalleryView', BandGalleryView, {collection: bandsCollection});
      bandGalleryView.render();
    },

    renderBandList: function () {
      var bandListView = Vm.create(this, 'BandListView', BandListView, {collection: this.collection});
      bandListView.render();
    }
  });
  return BandsPage;
});
