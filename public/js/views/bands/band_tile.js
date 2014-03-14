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
      this.isLoading = false;
      // bind to checkScroll 
      _.bindAll(this, 'checkScroll');
      $(window).scroll(this.checkScroll);

      // only render the list container once
      this.$el.html(bandListTemplate);
    },

    render: function () {

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      this.isLoading = false;

    },

    renderBand: function (model) {
      $('#band-list', this.el).append(new BandTileItemView({model: model}).render().el); 
    },

    checkScroll: function () {
      // if we are at the bottom of the page
      if(!(this.isLoading) && $(window).scrollTop() + $(window).height() == $(document).height()) {
        this.isLoading = true;
        this.collection.getNextPage(); // Load next page
        this.render();
      }
    }

  });
  return BandTileView;
});
