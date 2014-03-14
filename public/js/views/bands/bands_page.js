define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/band_list',
  'views/bands/band_gallery',
  'views/bands/band_tile',
  'text!templates/bands/bands_page.html',
], function($, _, Backbone, Vm, BandListView, BandGalleryView, BandTileView, bandsPageTemplate){
  var BandsPage = Backbone.View.extend({
    el: '#content',

    initialize: function() {
    },

    events: { 
      'click button#btn-gallery-view': 'renderBandGallery',
      'click button#btn-list-view': 'renderBandList',
      'click button#btn-tile-view': 'renderBandTile'
    },

    render: function () {
      this.$el.html(bandsPageTemplate);
      this.renderBandTile();

      require(['views/sidenav/bands_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });
    },

    renderBandGallery: function (model) {
      var bandGalleryView = Vm.create(this, 'BandGalleryView', BandGalleryView, {collection: this.collection});
      bandGalleryView.render();
    },

    renderBandList: function () {
      var bandListView = Vm.create(this, 'BandListView', BandListView, {collection: this.collection});
      bandListView.render();
    },

    renderBandTile: function () {
      var bandTileView = Vm.create(this, 'BandTileView', BandTileView, {collection: this.collection});
      bandTileView.render();
    }
  });
  return BandsPage;
});
