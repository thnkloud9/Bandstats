define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/band_gallery',
  'views/bands/band_list',
  'text!templates/bands/band_menu.html'
], function($, _, Backbone, Vm, BandGalleryView, BandListView, bandMenuTemplate){
  var BandMenuView = Backbone.View.extend({
    el: '#band-menu-container',

    initialize: function() {
    },

    events: { 
      'click button#btn-gallery-view': 'renderBandGallery',
      'click button#btn-list-view': 'renderBandList'
    },

    render: function () {
      this.$el.html(bandMenuTemplate);
      this.renderBandGallery();
    },

    renderBandGallery: function (model) {
      var bandGalleryView = Vm.create(this, 'BandGalleryView', BandGalleryView);
      bandGalleryView.render();
    },

    renderBandList: function () {
      var bandListView = Vm.create(this, 'BandListView', BandListView);
      bandListView.render();
    }

  });
  return BandMenuView;
});
