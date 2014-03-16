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
      this.children = {};
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

    renderBandGallery: function () {
      this.destroyChildren();
      var bandGalleryView = Vm.create(this, 'BandGalleryView', BandGalleryView, {collection: this.collection});
      $(bandGalleryView.render().el).appendTo('#bands-page-content');
      console.log(this.children);
    },

    renderBandList: function () {
      this.destroyChildren();
      var bandListView = Vm.create(this, 'BandListView', BandListView, {collection: this.collection});
      $(bandListView.render().el).appendTo('#bands-page-content');
      console.log(this.children);
    },

    renderBandTile: function () {
      this.destroyChildren();
      var bandTileView = Vm.create(this, 'BandTileView', BandTileView, {collection: this.collection});
      //bandTileView.collection.getFirstPage();
      $(bandTileView.render().el).appendTo('#bands-page-content');
      console.log(this.children);
    },

    destroyChildren: function() {
      var parent = this;
      _.each(this.children, function(child, name) {
        if (child.close) {
          child.close();
        }
        child.remove();
        child.undelegateEvents();
        child.unbind();
      }, this);
      this.children = {};
    }

  });
  return BandsPage;
});
